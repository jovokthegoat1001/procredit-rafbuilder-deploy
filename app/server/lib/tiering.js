// Deterministic tiering: turns the raw facts the model extracted (see prompt.js)
// into the final tier number (1-6), 'FAIL', or leaves a field unset (no data, stays
// blank for manual entry) for every document-extractable row in rafEngine.js's
// TIERING_CATS, plus the two mandatory-screening fields that share a computation
// with a tiered row (min_rev/revenue_tier, nbfc_exp/nbfc_debt_pct).
//
// Bucket tables below list only the WORST tier reachable for a given threshold —
// when the source framework merges several tier columns under one shared value
// (see the plan's "merged/shared thresholds" convention), a qualifying value
// resolves to the highest (worst) tier number in that merged group.

export function toNum(v) {
  if (v === undefined || v === null || v === 'USER_INPUT' || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function parseNumList(v) {
  if (Array.isArray(v)) {
    const nums = v.map((x) => toNum(x)).filter((n) => n !== null);
    return nums.length ? nums : null;
  }
  if (typeof v !== 'string' || v === 'USER_INPUT') return null;
  const nums = v.split(';').map((s) => toNum(s.trim())).filter((n) => n !== null);
  return nums.length ? nums : null;
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdevPop(arr, m) {
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}

// Round to 6 decimals before comparing so a value derived by floating-point
// arithmetic (e.g. a true 20.0% CAGR that computes as 19.999999996) classifies
// into the band it should, not the one just below/above the boundary.
const r6 = (n) => Math.round(n * 1e6) / 1e6;

// val >= threshold, checked highest-threshold-first — for "at least X" metrics.
function bucketDescending(val, pairs) {
  const v = r6(val);
  for (const [threshold, tier] of pairs) if (v >= threshold) return tier;
  return 'FAIL';
}

// val <= threshold, checked lowest-threshold-first — for "at most X" metrics.
function bucketAscending(val, pairs) {
  const v = r6(val);
  for (const [threshold, tier] of pairs) if (v <= threshold) return tier;
  return 'FAIL';
}

// |val - center| <= maxDev, checked tightest-band-first — for symmetric ranges.
function bucketDeviation(val, center, pairs) {
  const dev = r6(Math.abs(val - center));
  for (const [maxDev, tier] of pairs) if (dev <= maxDev) return tier;
  return 'FAIL';
}

function revCagrTier(rawPct) {
  const pct = r6(rawPct);
  if (pct >= 5 && pct < 10) return 1;
  if ((pct >= 10 && pct < 15) || (pct >= 3.5 && pct < 5)) return 2;
  if (pct >= 15 && pct < 20) return 3;
  if (pct >= 20 && pct < 25) return 5;
  if ((pct >= 25 && pct < 30) || (pct >= 1 && pct < 3.5)) return 6;
  return 'FAIL';
}

export function computeTiering(parsed) {
  const totalDebt = toNum(parsed.ltr_total_debt);
  const nonBankDebt = toNum(parsed.ltr_non_bank_debt);
  const nonBankDebtEarliest = toNum(parsed.ltr_non_bank_debt_earliest);
  const disclosedDebt = toNum(parsed.ltr_disclosed_debt);
  const fsLoanPayable = toNum(parsed.fs_loan_payable);
  const revCredits = toNum(parsed.revCredits);
  const minRevenue3y = toNum(parsed.fin_min_revenue_3y);
  const auditedSales = toNum(parsed.fs_audited_sales);
  const inhouseSales = toNum(parsed.fs_inhouse_sales);
  const salesBreakdown = toNum(parsed.fs_sales_breakdown);
  const ebit = toNum(parsed.fs_ebit);
  const interestExpense = toNum(parsed.fs_interest_expense);
  const netMargin3y = toNum(parsed.fin_net_margin_3y);
  const revCagr3y = toNum(parsed.fin_revenue_cagr_3y);
  const cccDays = toNum(parsed.fin_ccc_days);
  const chequeReturns = toNum(parsed.ltr_cheque_returns_count);
  const dpd30Count = toNum(parsed.cbr_dpd30_count);
  const dpd60Count = toNum(parsed.cbr_dpd60_count);
  const creditCheckCount = toNum(parsed.cbr_credit_check_count);
  const ownershipPct = toNum(parsed.gis_family_ownership_pct);
  const borrowYears = toNum(parsed.ltr_borrow_years);

  // Mandatory Screening: min_rev (Php 100M floor) + revenue_tier share one source figure.
  // Floor (not round) the display to 1 decimal so a sub-100M value (e.g. 99.6M) never
  // rounds UP to "Php 100m" and shows a false PASS on the mandatory revenue screen.
  if (minRevenue3y !== null) {
    parsed.min_rev = `Php ${Math.floor(minRevenue3y / 1e5) / 10}m`;
    parsed.revenue_tier = bucketDescending(minRevenue3y / 1e6, [
      [700, 1], [600, 2], [500, 3], [300, 4], [200, 5], [100, 6],
    ]);
  }

  // Mandatory Screening: nbfc_exp (65% ceiling) + Debt Sustainability's nbfc_debt_pct
  // share the same non-bank-debt / total-debt ratio.
  if (totalDebt !== null && totalDebt > 0 && nonBankDebt !== null) {
    const pct = (nonBankDebt / totalDebt) * 100;
    parsed.nbfc_exp = `${pct.toFixed(2)}%`;
    parsed.nbfc_debt_pct = bucketAscending(pct, [
      [15, 1], [25, 2], [30, 3], [40, 4], [50, 5], [65, 6],
    ]);
  }

  if (totalDebt !== null && totalDebt > 0 && disclosedDebt !== null) {
    const pct = ((totalDebt - disclosedDebt) / totalDebt) * 100;
    parsed.undisc_borrow = bucketAscending(pct, [[15, 1], [25, 3], [35, 5], [45, 6]]);
  }

  if (totalDebt !== null && totalDebt > 0 && fsLoanPayable !== null) {
    const pct = (Math.abs(totalDebt - fsLoanPayable) / totalDebt) * 100;
    parsed.pf_debt_gap = bucketAscending(pct, [[20, 2], [35, 4], [50, 6]]);
  }

  if (nonBankDebtEarliest !== null && nonBankDebtEarliest > 0 && nonBankDebt !== null) {
    const pct = ((nonBankDebt - nonBankDebtEarliest) / nonBankDebtEarliest) * 100;
    parsed.nbfc_inc = bucketAscending(pct, [[15, 1], [25, 3], [40, 6]]);
  }

  if (auditedSales !== null && auditedSales > 0 && inhouseSales !== null && inhouseSales > 0) {
    const pct = (Math.abs(auditedSales - inhouseSales) / inhouseSales) * 100;
    parsed.audit_gap = bucketAscending(pct, [[20, 2], [35, 4], [50, 6]]);
  }

  if (revCredits !== null && inhouseSales !== null && inhouseSales > 0) {
    const pct = (Math.abs(revCredits - inhouseSales) / inhouseSales) * 100;
    parsed.rev_cred_gap = bucketAscending(pct, [[20, 2], [35, 4], [50, 6]]);
  }

  if (salesBreakdown !== null && inhouseSales !== null && inhouseSales > 0) {
    const pct = (Math.abs(salesBreakdown - inhouseSales) / inhouseSales) * 100;
    parsed.sales_bd_gap = bucketAscending(pct, [[20, 2], [35, 4], [50, 6]]);
  }

  if (revCagr3y !== null) parsed.rev_cagr = revCagrTier(revCagr3y);
  if (netMargin3y !== null) parsed.net_margin = bucketDescending(netMargin3y, [[8, 1], [5, 3], [2, 5], [1, 6]]);

  if (totalDebt !== null && minRevenue3y !== null && minRevenue3y > 0) {
    const pct = (totalDebt / minRevenue3y) * 100;
    parsed.debt_sales = bucketAscending(pct, [[20, 1], [25, 2], [30, 3], [35, 5], [45, 6]]);
  }

  if (ebit !== null && interestExpense !== null && interestExpense > 0) {
    parsed.icr = bucketDescending(ebit / interestExpense, [
      [3.0, 1], [2.5, 2], [2.0, 3], [1.5, 4], [1.25, 5], [1.1, 6],
    ]);
  }

  if (cccDays !== null) parsed.ccc = bucketAscending(cccDays, [[60, 1], [75, 2], [90, 3], [120, 5], [150, 6]]);
  // dss (Debt Sustainability Score) and dsc (Debt Service Capacity) are NOT derivable
  // from the four uploaded documents under the current extraction schema — they are
  // manual-entry dropdown rows in rafEngine.js, filled by the credit officer.

  if (chequeReturns !== null) parsed.cheque_ret = bucketAscending(chequeReturns, [[1, 1], [2, 2], [3, 3], [5, 4], [7, 5], [10, 6]]);
  if (dpd30Count !== null) parsed.dpd30 = bucketAscending(dpd30Count, [[1, 1], [2, 3], [3, 5], [5, 6]]);
  if (dpd60Count !== null) parsed.dpd60 = bucketAscending(dpd60Count, [[1, 1], [2, 3], [3, 6]]);
  // credit_check: mandatory row opts are ['0','1','2+'] — collapse counts ≥2 to '2+'.
  if (creditCheckCount !== null) parsed.credit_check = creditCheckCount >= 2 ? '2+' : String(creditCheckCount);

  if (ownershipPct !== null) parsed.ownership = bucketDescending(ownershipPct, [[75, 3], [66, 5], [40, 6]]);
  if (borrowYears !== null) parsed.borrow_hist = bucketDescending(borrowYears, [[7, 1], [6, 2], [5, 3], [4, 4], [3, 5], [2, 6]]);

  // adb_pct / adb (CoV, no longer scored) / disc_cash_pct all derive from the monthly
  // ADB series; last3m_credits from the monthly revenue-credits series.
  const monthlyAdb = parseNumList(parsed.ltr_monthly_adb);
  const annualCashDeposits = toNum(parsed.ltr_annualized_cash_deposits);
  if (monthlyAdb && monthlyAdb.length >= 2) {
    const avgAdb = mean(monthlyAdb);
    if (revCredits !== null && revCredits > 0 && avgAdb > 0) {
      parsed.adb_pct = bucketDescending((avgAdb / revCredits) * 100, [
        [2.5, 1], [2.0, 2], [1.5, 3], [1.25, 4], [1.0, 5], [0.75, 6],
      ]);
    }
    if (annualCashDeposits !== null && avgAdb > 0) {
      parsed.disc_cash_pct = bucketDeviation((annualCashDeposits / avgAdb) * 100, 100, [
        [5, 1], [10, 3], [20, 5], [30, 6],
      ]);
    }
  }

  const monthlyRevCredits = parseNumList(parsed.ltr_monthly_rev_credits);
  if (monthlyRevCredits && monthlyRevCredits.length >= 4) {
    const sumAll = monthlyRevCredits.reduce((a, b) => a + b, 0);
    const sumLast3 = monthlyRevCredits.slice(-3).reduce((a, b) => a + b, 0);
    if (sumAll > 0) {
      parsed.last3m_credits = bucketDeviation((sumLast3 / sumAll) * 100, 50, [
        [5, 1], [10, 2], [15, 3], [17.5, 4], [20, 6],
      ]);
    }
  }

  const AUX_KEYS = [
    'ltr_total_debt', 'ltr_non_bank_debt', 'ltr_non_bank_debt_earliest', 'ltr_disclosed_debt',
    'fs_loan_payable', 'ltr_monthly_adb', 'ltr_monthly_rev_credits', 'ltr_annualized_cash_deposits',
    'ltr_cheque_returns_count', 'ltr_borrow_years', 'gis_family_ownership_pct', 'fin_min_revenue_3y',
    'fs_audited_sales', 'fs_inhouse_sales', 'fs_sales_breakdown', 'fs_ebit', 'fs_interest_expense',
    'fin_net_margin_3y', 'fin_revenue_cagr_3y', 'fin_ccc_days',
    'cbr_credit_check_count', 'cbr_dpd30_count', 'cbr_dpd60_count',
  ];
  for (const k of AUX_KEYS) delete parsed[k];
  return parsed;
}
