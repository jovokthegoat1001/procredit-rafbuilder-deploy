// Reduces the per-document extraction envelopes (see extractionSchemas.js) down to
// the flat raw-value object that tiering.js consumes, and performs the derivations
// the extraction schema deliberately moved OUT of the model (DPD-window counting,
// family-ownership grouping, multi-year financial reductions, document date math).
//
// Output shape is intentionally the same flat object the old single-prompt pipeline
// produced, so tiering.js and the React client are unchanged:
//   - form keys      : econGroup, obligorName, industry, regDate, legalStatus,
//                      revCredits, totalDebt, adb
//   - direct rows    : ubo, nfis, bg_screen (Yes/No)
//   - raw scalars    : the fs_*/ltr_*/cbr_*/gis_*/fin_* inputs tiering.js buckets
//   - monthly arrays : ltr_monthly_adb / ltr_monthly_rev_credits (numeric arrays)
// Anything not derivable is simply omitted (left blank for manual entry) — never zero.

// ── leaf / number helpers (tolerant of both {value,...} envelopes and plain values) ──
export function leaf(x) {
  if (x && typeof x === 'object' && !Array.isArray(x) && 'value' in x) return x.value;
  return x;
}
export function num(x) {
  const v = leaf(x);
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}
function str(x) {
  const v = leaf(x);
  return v === null || v === undefined ? '' : String(v).trim();
}
function bool(x) {
  const v = leaf(x);
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return /^(y|yes|true|hit)$/i.test(v.trim());
  return false;
}
function parseDate(v) {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s.length === 7 ? s + '-01' : s); // accept YYYY-MM
  return Number.isNaN(d.getTime()) ? null : d;
}
// month index (year*12 + month) for windowing without end-of-month day overflow.
function monthIndex(d) { return d ? d.getFullYear() * 12 + d.getMonth() : null; }
// numeric year from a "FY-2024" / "2024" label, else null.
function fyYear(label) { const m = String(label).match(/\d{4}/); return m ? Number(m[0]) : null; }
// Printed currency scale → absolute-peso multiplier. Financial spreads are commonly
// stated "IN PESO '000"; the extractor keeps the printed figure and records the
// scale, so we normalize here before any cross-document comparison (e.g. FS loan
// payable in '000 vs LTR total debt in absolute pesos).
function unitScale(unit) {
  const u = String(unit || '').toLowerCase();
  if (/thousand|'?\s*000\b/.test(u)) return 1e3;
  if (/billion|\bbn\b/.test(u)) return 1e9;
  if (/million|\bmn\b|'?\s*m\b/.test(u)) return 1e6;
  return 1;
}
// numeric value scaled to absolute pesos: honors a per-leaf `unit` if present, else
// the document-level fallback unit (e.g. FS currency_unit).
function money(x, fallbackUnit) {
  const n = num(x);
  if (n === null) return null;
  const leafUnit = (x && typeof x === 'object' && !Array.isArray(x)) ? x.unit : null;
  return n * unitScale(leafUnit != null && leafUnit !== '' ? leafUnit : fallbackUnit);
}
function surname(name) {
  const parts = String(name || '').trim().split(/[\s,]+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1].toLowerCase() : '';
}

// map GIS company_type text to the RAF legal_status enum the tierFn expects.
function mapLegalStatus(companyType) {
  const t = companyType.toLowerCase();
  if (/one person|(\bopc\b)/.test(t)) return 'Partnership'; // RAF groups "Partnership / OPC" together
  if (/partnership/.test(t)) return 'Partnership';
  if (/sole|proprietor/.test(t)) return 'Sole Proprietorship';
  if (/corp|stock|inc\b/.test(t)) return 'Corporation';
  return companyType ? 'Corporation' : '';
}

export function mapExtraction(envelopes) {
  const out = {};
  const warnings = [];
  const gis = envelopes.gis?.fields || null;
  const fs = envelopes.fs?.fields || null;
  const ltr = envelopes.ltr?.fields || null;
  const cbr = envelopes.cbr?.fields || null;

  // carry over each document's own extraction_warnings, prefixed by doc type
  // (models sometimes emit this as a bare string instead of an array — guard it)
  for (const [docType, env] of Object.entries(envelopes)) {
    const ws = Array.isArray(env?.extraction_warnings) ? env.extraction_warnings
      : (env?.extraction_warnings ? [env.extraction_warnings] : []);
    ws.forEach((w) => { if (w) warnings.push(`[${docType.toUpperCase()}] ${str(w)}`); });
  }

  // ── GIS ──
  if (gis) {
    const regDate = parseDate(gis.date_registered);
    if (regDate) out.regDate = regDate.toISOString().slice(0, 10);
    const legal = mapLegalStatus(str(gis.company_type));
    if (legal) out.legalStatus = legal;
    const name = str(gis.corporate_name);
    if (name) out.obligorName = name;
    const parent = str(gis.parent_company);
    if (parent) out.econGroup = parent; else if (name) out.econGroup = name;
    const industry = str(gis.industry_classification);
    if (industry) out.industry = industry;

    // Known UBO — Yes if any beneficial owner is disclosed
    const bos = Array.isArray(gis.beneficial_owners) ? gis.beneficial_owners : [];
    if (bos.length) out.ubo = 'Yes';
    else if (Array.isArray(gis.stockholders) && gis.stockholders.length) out.ubo = 'No';

    // Ownership Structure % — RAF wants "Single + Spousal + Offspring + Siblings".
    // Pure extraction can't know spousal links, so approximate with the largest
    // shared-surname group among stockholders and FLAG it for officer review.
    const holders = (Array.isArray(gis.stockholders) ? gis.stockholders : [])
      .filter((h) => h && typeof h === 'object')
      .map((h) => ({ pct: num(h.ownership_pct), sn: surname(leaf(h.name)) }))
      .filter((h) => h.pct !== null && h.sn);
    if (holders.length) {
      const bySurname = {};
      holders.forEach((h) => { bySurname[h.sn] = (bySurname[h.sn] || 0) + h.pct; });
      const familyPct = Math.max(...Object.values(bySurname));
      out.gis_family_ownership_pct = familyPct;
      warnings.push(`[GIS] Family ownership % (${familyPct.toFixed(1)}%) approximated from the largest shared-surname stockholder group; confirm spousal/relative links and override the Ownership Structure tier if needed.`);
      const totalPct = holders.reduce((a, h) => a + h.pct, 0);
      if (Math.abs(totalPct - 100) > 1) warnings.push(`[GIS] Stockholder ownership sums to ${totalPct.toFixed(1)}%, not 100%.`);
    }
    if (str(gis.external_auditor_name)) {
      warnings.push(`[GIS] External auditor "${str(gis.external_auditor_name)}" found — grade it against the auditor list to set Auditor Quality (manual).`);
    }
  }

  // ── Financial Spread (audited + in-house) ──
  if (fs) {
    // Financial spreads are frequently printed "IN PESO '000" — scale every FS money
    // figure to absolute pesos so cross-document gaps (FS vs LTR) are comparable.
    const fsUnit = str(fs.currency_unit);
    const m$ = (x) => money(x, fsUnit);
    const aud = fs.audited || {};
    const ih = fs.in_house || {};
    const audIS = aud.income_statement_per_year || {};
    const ihIS = ih.income_statement_per_year || {};
    const yearsOf = (o) => Object.keys(o || {}).sort(); // FY labels ascending
    const recent = (o) => { const ks = yearsOf(o); return ks.length ? o[ks[ks.length - 1]] : null; };

    // [{year, rev}] per source (revenue scaled to absolute pesos), keeping the FY label
    const revPairs = (isObj) => yearsOf(isObj)
      .map((y) => ({ year: fyYear(y), rev: m$(isObj[y]?.revenue) }))
      .filter((p) => p.rev !== null);
    const audRev = revPairs(audIS);
    const ihRev = revPairs(ihIS);
    const audRecent = recent(audIS) || {};
    const ihRecent = recent(ihIS) || {};

    const audSales = m$(audRecent.revenue);
    const ihSales = m$(ihRecent.revenue);
    if (audSales !== null) out.fs_audited_sales = audSales;
    if (ihSales !== null) out.fs_inhouse_sales = ihSales;

    // Min. Annual Revenue Last 3Y (min of audited / in-house). Sales breakdown is a
    // separate document not covered by this schema → omitted.
    const allRev = audRev.concat(ihRev).map((p) => p.rev);
    if (allRev.length) out.fin_min_revenue_3y = Math.min(...allRev);
    else warnings.push('[FS] No income-statement revenue found — revenue screen, CAGR, and net-margin criteria left for manual entry (P&L page may be missing).');

    // 3Y revenue CAGR — prefer audited, fall back to in-house. Annualize over the
    // actual YEAR SPAN between the first and last reported year (not the count of
    // reported points), so a missing middle year doesn't overstate the rate.
    const cagrSrc = audRev.length >= 2 ? audRev : ihRev;
    if (cagrSrc.length >= 2) {
      const first = cagrSrc[0], last = cagrSrc[cagrSrc.length - 1];
      const span = (first.year !== null && last.year !== null && last.year > first.year)
        ? last.year - first.year : cagrSrc.length - 1;
      if (first.rev > 0 && span > 0) out.fin_revenue_cagr_3y = (Math.pow(last.rev / first.rev, 1 / span) - 1) * 100;
    }

    // Min net-income margin over the years — try audited, fall back to in-house when
    // audited yields no computable margin. (Margin is a ratio, so unit-independent.)
    const marginsOf = (isObj) => yearsOf(isObj).map((y) => {
      const rev = num(isObj[y]?.revenue), ni = num(isObj[y]?.net_income);
      return rev && rev !== 0 && ni !== null ? (ni / rev) * 100 : null;
    }).filter((x) => x !== null);
    const margins = marginsOf(audIS).length ? marginsOf(audIS) : marginsOf(ihIS);
    if (margins.length) out.fin_net_margin_3y = Math.min(...margins);

    // ICR = EBIT / interest expense, most recent year (audited preferred)
    const ebit = m$(audRecent.ebit) ?? m$(ihRecent.ebit);
    const interest = m$(audRecent.interest_expense) ?? m$(ihRecent.interest_expense);
    if (ebit !== null) out.fs_ebit = ebit;
    if (interest !== null) out.fs_interest_expense = interest;

    // FS total loan payable = higher of audited / in-house (current + noncurrent), most recent year
    const loanPayable = (bs) => {
      const r = recent(bs) || {};
      const cur = m$(r.loans_payable_current), non = m$(r.loans_payable_noncurrent);
      if (cur === null && non === null) return null;
      return (cur || 0) + (non || 0);
    };
    const audLP = loanPayable(aud.balance_sheet_per_year);
    const ihLP = loanPayable(ih.balance_sheet_per_year);
    const lp = [audLP, ihLP].filter((v) => v !== null);
    if (lp.length) out.fs_loan_payable = Math.max(...lp);

    // Cash Conversion Cycle — prefer in-house working_capital_days, else compute from BS + IS
    const wcd = ih.working_capital_days || {};
    const dio = num(wcd.days_inventory), dso = num(wcd.days_receivable), dpo = num(wcd.days_payable);
    if (dio !== null && dso !== null && dpo !== null) {
      out.fin_ccc_days = dio + dso - dpo;
    } else {
      const bs = recent(ih.balance_sheet_per_year) || recent(aud.balance_sheet_per_year) || {};
      const isRec = ihRecent.revenue !== undefined ? ihRecent : audRecent;
      const inv = num(bs.inventory), rec = num(bs.trade_receivables), pay = num(bs.trade_payables);
      const cogs = num(isRec.cogs), rev = num(isRec.revenue);
      if (inv !== null && rec !== null && pay !== null && cogs && rev) {
        out.fin_ccc_days = (inv / cogs) * 365 + (rec / rev) * 365 - (pay / cogs) * 365;
      }
    }

    // balance-sheet integrity warnings
    ['audited', 'in_house'].forEach((k) => {
      const bsY = (fs[k]?.balance_sheet_per_year) || {};
      Object.entries(bsY).forEach(([y, bs]) => {
        const chk = num(bs?.balance_check);
        if (chk !== null && Math.abs(chk) > 1) warnings.push(`[FS] ${k} ${y} balance_check = ${chk} (assets ≠ liabilities + equity).`);
      });
    });
  }

  // ── LTR ──
  if (ltr) {
    const rc = num(ltr.annualized_revenue_credits);
    if (rc !== null) out.revCredits = rc;

    const months = (Array.isArray(ltr.monthly_stats) ? ltr.monthly_stats : [])
      .filter((m) => m && typeof m === 'object')
      .map((m) => ({ adb: num(m.avg_daily_balance), rev: num(m.revenue_credits), cash: num(m.cash_deposits) }));
    const adbSeries = months.map((m) => m.adb).filter((n) => n !== null);
    const revSeries = months.map((m) => m.rev).filter((n) => n !== null);
    const cashSeries = months.map((m) => m.cash).filter((n) => n !== null);
    if (adbSeries.length) {
      out.ltr_monthly_adb = adbSeries;
      out.adb = adbSeries.reduce((a, b) => a + b, 0) / adbSeries.length; // representative ADB for limit calc
    }
    if (revSeries.length) out.ltr_monthly_rev_credits = revSeries;
    if (cashSeries.length) out.ltr_annualized_cash_deposits = cashSeries.reduce((a, b) => a + b, 0);

    // inward cheque returns over the trailing 6 months — sort chronologically first,
    // since the schema doesn't guarantee cheque_activity_monthly is oldest-first.
    const cheques = (Array.isArray(ltr.cheque_activity_monthly) ? ltr.cheque_activity_monthly : [])
      .filter((m) => m && typeof m === 'object')
      .map((m) => ({ month: str(m.month), count: num(m.customer_bounces_count) }))
      .filter((m) => m.count !== null)
      .sort((a, b) => a.month.localeCompare(b.month));
    if (cheques.length) out.ltr_cheque_returns_count = cheques.slice(-6).reduce((a, b) => a + b.count, 0);

    // debt estimates — pick latest and earliest as-of columns
    const de = ltr.debt_estimates || {};
    const dates = (Array.isArray(de.as_of_dates) ? de.as_of_dates : []).map((d) => parseDate(d));
    if (dates.length && dates.some(Boolean)) {
      let li = 0, ei = 0;
      dates.forEach((d, i) => {
        if (!d) return;
        if (!dates[li] || d > dates[li]) li = i;
        if (!dates[ei] || d < dates[ei]) ei = i;
      });
      const at = (arr, i) => (Array.isArray(arr) && arr[i] !== undefined ? num(arr[i]) : null);
      const nbAt = (i) => {
        const u = at(de.non_bank_debt_unsecured, i), s = at(de.non_bank_debt_secured, i);
        if (u === null && s === null) return null;
        return (u || 0) + (s || 0);
      };
      const totalLatest = at(de.total_debt, li);
      if (totalLatest !== null) { out.ltr_total_debt = totalLatest; out.totalDebt = totalLatest; }
      const nbLatest = nbAt(li);
      if (nbLatest !== null) out.ltr_non_bank_debt = nbLatest;
      if (li !== ei) { const nbEarliest = nbAt(ei); if (nbEarliest !== null) out.ltr_non_bank_debt_earliest = nbEarliest; }
      const disc = at(de.disclosed_debt, li);
      if (disc !== null) {
        out.ltr_disclosed_debt = disc;
        if (totalLatest !== null && disc > totalLatest) warnings.push('[LTR] Disclosed debt exceeds total debt (undisclosed would be negative) — check the debt-estimates columns.');
      }
    }

    // Qualified borrowing history — proxy: years from earliest borrowing start date
    // to report date. Discard implausible years (OCR/typo dates like "8/31/0202")
    // so a single bad date can't produce a 1000+ year span.
    const reportDate = parseDate(ltr.report_date);
    const reportYear = reportDate ? reportDate.getFullYear() : null;
    const rawStarts = (Array.isArray(ltr.borrowing_detail) ? ltr.borrowing_detail : [])
      .filter((b) => b && typeof b === 'object')
      .map((b) => parseDate(b.start_date)).filter(Boolean);
    const starts = rawStarts.filter((d) => d.getFullYear() >= 1970 && (!reportYear || d.getFullYear() <= reportYear));
    if (rawStarts.length > starts.length) {
      warnings.push('[LTR] Ignored one or more borrowing start dates with implausible years (likely OCR/typo) when computing Qualified Borrowing History.');
    }
    if (reportDate && starts.length) {
      const earliest = starts.reduce((a, b) => (a < b ? a : b));
      const yrs = Math.max(0, Math.floor((reportDate - earliest) / (365.25 * 24 * 3600 * 1000)));
      out.ltr_borrow_years = yrs;
      warnings.push(`[LTR] Qualified Borrowing History (${yrs} yrs) approximated from the earliest borrowing start date; RAF wants years of continued bank exposure >10% of sales — confirm.`);
    }
    const missing = Array.isArray(ltr.missing_statements) ? ltr.missing_statements
      : (ltr.missing_statements ? [ltr.missing_statements] : []);
    missing.forEach((m) => { if (m) warnings.push(`[LTR] Missing statement: ${str(m)}`); });
  }

  // ── CBR ──
  if (cbr) {
    const reportDate = parseDate(cbr.report_date) || parseDate(envelopes.cbr?.document_date);
    if (cbr.nfis) out.nfis = bool(cbr.nfis.hit) ? 'No' : 'Yes';
    const nsHit = cbr.namescan ? bool(cbr.namescan.hit) : false;
    const courtCases = Array.isArray(cbr.crif_court_cases) ? cbr.crif_court_cases.length : 0;
    out.bg_screen = nsHit || courtCases > 0 ? 'No' : 'Yes';
    if (nsHit) warnings.push('[CBR] Namescan hit — review before clearing Background Screening.');
    if (courtCases > 0) warnings.push(`[CBR] ${courtCases} court case(s) found in CRIF — review Background Screening.`);

    const dels = (Array.isArray(cbr.cic_delinquencies) ? cbr.cic_delinquencies : [])
      .filter((d) => d && typeof d === 'object')
      .map((d) => ({
        cycles: num(d.cycles),
        monthIdx: monthIndex(parseDate(d.dpd_event_month)),
        remarks: str(d.remarks).toUpperCase(),
        isCompany: d.is_company === undefined ? true : bool(d.is_company),
      }));
    // Policy: principal/UBO/director delinquencies count the same as the obligor's own
    // (closely-held SMEs — owner and business credit are intertwined). Surface how many
    // of the counted events are principal-level so the officer sees the split.
    const personalCount = dels.filter((d) => !d.isCompany).length;
    if (personalCount > 0) warnings.push(`[CBR] ${personalCount} of the counted delinquency event(s) are principal/UBO accounts (included in Credit Check and 30/60 DPD counts per policy).`);

    // Window by month index (report month − event month) to avoid end-of-month
    // day-overflow. mid window = 6..24 months ago; last6 = 0..6 months ago.
    const rIdx = monthIndex(reportDate);
    if (rIdx !== null) {
      const inMid = (d) => d.monthIdx !== null && (rIdx - d.monthIdx) >= 6 && (rIdx - d.monthIdx) < 24;
      const inLast6 = (d) => d.monthIdx !== null && (rIdx - d.monthIdx) >= 0 && (rIdx - d.monthIdx) < 6;
      out.cbr_dpd30_count = dels.filter((d) => d.cycles === 1 && inMid(d)).length;
      out.cbr_dpd60_count = dels.filter((d) => d.cycles === 2 && inMid(d)).length;
      out.cbr_credit_check_count = dels.filter((d) => inLast6(d) && (d.cycles >= 1 || d.remarks.includes('PAST DUE'))).length;
    } else {
      warnings.push('[CBR] No report date — could not window 30/60 DPD or last-6-month credit-check counts.');
    }
  }

  // ── source-company cross-check ──
  const names = Object.entries(envelopes)
    .map(([d, e]) => ({ d, n: str(e?.obligor_name_on_document) }))
    .filter((x) => x.n);
  if (names.length > 1) {
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ')
      .replace(/\b(inc|corp|corporation|co|company|ltd|opc|holdings|group|the)\b/g, ' ')
      .replace(/\s+/g, ' ').trim();
    const firstTok = (s) => norm(s).split(' ')[0] || '';
    const base = norm(names[0].n);
    const baseTok = firstTok(names[0].n);
    // A real mismatch only if a name neither is a prefix of the base (abbreviation)
    // nor shares the base's distinctive first token (e.g. "SYNERCORE" vs
    // "SYNERCORE HEAVY INDUSTRIES CORPORATION" is NOT a mismatch).
    const matches = (nm) => {
      const x = norm(nm);
      return !x || x === base || x.startsWith(base) || base.startsWith(x) || (baseTok && firstTok(nm) === baseTok);
    };
    const mism = names.filter((x) => !matches(x.n));
    out.source_company_flags = mism.length
      ? `Name mismatch across documents: ${names.map((x) => `${x.d.toUpperCase()}="${x.n}"`).join(', ')}`
      : '';
  } else {
    out.source_company_flags = '';
  }

  const obligor = out.obligorName || names[0]?.n || 'the obligor';
  out.summary = `Auto-populated from ${Object.keys(envelopes).length} document(s) for ${obligor}. ${warnings.length} data-quality flag(s) raised for review.`;

  return { data: out, warnings };
}
