// Pure RAF scoring/data-model logic, ported from the original RAF Score Triangulator.
// No React, no DOM — safe to unit test and safe to reuse on the server if ever needed.
//
// Doc-extracted rows (sourced from the 4 uploaded document types) arrive in
// rowValues already resolved to a tier number / 'FAIL' / 'N/A' by the server's
// lib/tiering.js — their tierFn is `identity`, a pass-through. Manual/interview-
// sourced rows (KSF grid, Auditor Quality, S.C.O. visit, Data Triangulator, etc.)
// are unaffected by that pipeline — a credit officer picks a category from a
// dropdown and tierFn maps that label to a tier number here, exactly as before.

// Doc-extracted rows arrive from the server already resolved to a JS number (the
// tier) or the literal strings 'FAIL'/'N/A' — identity just passes those through.
// If a credit officer hand-edits one of these fields in the UI, the value comes
// back as a string from the input's onChange; coerce that back to a number so
// compute()'s `typeof t === 'number'` check still recognizes it.
const identity = (v) => {
  if (v === 'FAIL' || v === 'N/A') return v;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 6 ? n : 'FAIL';
};

export const MANDATORY_ROWS = [
  { key: 'reg_date', label: 'Date of Original Business Registration', screen: 'Before July 2023', actual: '1978-12-29', type: 'date' },
  { key: 'min_rev', label: 'Minimum Annual Revenue Last 3 Years (Min. of Audited, In-House, Sales Br. Down)', screen: 'Php 100M', actual: 'Php 499m', type: 'text', fmt: 'money' },
  { key: 'afs_itr', label: `Final ${Number(getPHDate().slice(0, 4)) - 1} AFS & ITR submitted`, screen: 'Yes', actual: 'Yes', type: 'select', opts: ['Yes', 'No'] },
  { key: 'gis', label: 'Up to Date GIS or DTI Business Name Registration', screen: 'Registration updated, shareholding fully disclosed', actual: 'Yes', type: 'select', opts: ['Yes', 'No'] },
  { key: 'ubo', label: 'Known Ultimate Beneficial Owner or Proprietor', screen: 'UBO declared and in direct contact with ProCredit', actual: 'Yes', type: 'select', opts: ['Yes', 'No'] },
  { key: 'bg_screen', label: 'Background Screening Results of Company (Namescan, ref. checking, desktop research)', screen: 'No negative findings over last 3 years', actual: 'Yes', type: 'select', opts: ['Yes', 'No', 'Conditional'] },
  { key: 'nfis', label: 'NFIS Check', screen: 'No negative findings over last 3 years', actual: 'Yes', type: 'select', opts: ['Yes', 'No'] },
  { key: 'credit_check', label: 'Credit Check - Last 6 months (CIC, LoanDex, Lender Ref. Check)', screen: 'No delay or default in last 6 months', actual: '1', type: 'select', opts: ['0', '1', '2+'] },
  { key: 'tcc', label: 'TCC Regulatory Requirements', screen: 'No negative finds as of today', actual: 'Yes', type: 'select', opts: ['Yes', 'No', 'Pending'] },
  { key: 'dole', label: 'DOLE Regulatory Requirements', screen: 'No negative finds as of today', actual: 'Yes', type: 'select', opts: ['Yes', 'No', 'Pending'] },
  { key: 'bank_stmt', label: 'Acceptable Bank Statements (all operating accts. analyzed by Hobbiate)', screen: 'Yes', actual: 'Yes', type: 'select', opts: ['Yes', 'No'] },
  { key: 'nbfc_exp', label: "NBFC Exposure (% of obligor's pre-money debt)", screen: '<= 65%', actual: '0.00%', type: 'text', fmt: 'percent' },
];

export const TIERING_CATS = [
  {
    cat: 'Target Market Fundamentals',
    rows: [
      { key: 'track_record', label: "Obligor's Sustained Track Record (rev. ≥100M in last 3Y)", bands: ['≥10 yrs', '≥10 yrs', '≥10 yrs', '≥7 yrs', '≥5 yrs', '≥3 yrs'], opts: ['10 or more years', '7 or more years', '5 or more years', '3 or more years', 'Less than 3 years'], actual: '', tierFn: (v) => v === '10 or more years' ? 3 : v === '7 or more years' ? 4 : v === '5 or more years' ? 5 : v === '3 or more years' ? 6 : 'FAIL' },
      { key: 'legal_status', label: 'Obligor Legal Status', bands: ['Corp.', 'Corp.', 'Corp.', 'Corp.', 'Partnership/OPC', 'Sole Prop'], opts: ['Corporation', 'Sole Proprietorship', 'Partnership'], actual: 'Corporation', tierFn: (v) => v === 'Corporation' ? 4 : v === 'Partnership' ? 5 : v === 'Sole Proprietorship' ? 6 : 'FAIL' },
      { key: 'revenue_tier', label: 'Min. Annual Revenue Last 3 Years (Group Revenue)', bands: ['>Php 700m', 'Php 600m', 'Php 500m', 'Php 300m', '>Php 200m', '>Php 100m'], actual: 4, tierFn: identity },
      { key: 'borrow_hist', label: 'Qualified Borrowing History (yrs bank exposure >10% of sales)', bands: ['≥7 yrs', '≥6 yrs', '≥5 yrs', '≥4 yrs', '≥3 yrs', '≥2 yrs'], actual: 1, tierFn: identity },
    ],
  },
  {
    cat: 'Corporate Governance',
    note: 'for gaps, Actual shown, Tier based on absolute values',
    rows: [
      { key: 'ownership', label: 'Ownership Structure (Single + Spousal + Offspring + Siblings)', bands: ['>75%', '>75%', '>75%', '>66%', '>66%', '>40%'], actual: 6, tierFn: identity },
      { key: 'audit_gap', label: 'Audited / In-house Sales Gap', bands: ['≤20%', '≤20%', '≤35%', '≤35%', '≤50%', '≤50%'], actual: 2, tierFn: identity },
      { key: 'pf_debt_gap', label: 'Pro Forma Debt / FS Debt Gap', bands: ['≤20%', '≤20%', '≤35%', '≤35%', '≤50%', '≤50%'], actual: 6, tierFn: identity },
      { key: 'rev_cred_gap', label: 'Revenue Credits / Pro Forma Sales Gap', bands: ['≤20%', '≤20%', '≤35%', '≤35%', '≤50%', '≤50%'], actual: null, tierFn: identity },
      { key: 'sales_bd_gap', label: 'Sales Breakdown / In-house Sales Gap', bands: ['≤20%', '≤20%', '≤35%', '≤35%', '≤50%', '≤50%'], actual: 6, tierFn: identity },
      { key: 'core_rev_pct', label: 'Core Operations Revenue (%)', bands: ['≥90%', '≥80%', '≥80%', '≥70%', '≥70%', '≥60%'], opts: ['90 pct or more', '80 pct or more', '70 pct or more', '60 pct or more', 'Less than 60 pct'], actual: '90 pct or more', tierFn: (v) => v === '90 pct or more' ? 1 : v === '80 pct or more' ? 3 : v === '70 pct or more' ? 5 : v === '60 pct or more' ? 6 : 'FAIL' },
      { key: 'biz_cons', label: 'Business Consistency (yrs in same line of business)', bands: ['≥10 yrs', '≥10 yrs', '≥10 yrs', '≥5 yrs', '≥5 yrs', '≥5 yrs'], opts: ['10 or more years', '5 or more years', 'Less than 5 years'], actual: '10 or more years', tierFn: (v) => v === '10 or more years' ? 3 : v === '5 or more years' ? 6 : 'FAIL' },
      { key: 'ksf', label: 'Key Success Factors (Finance Team, Fin. Awareness, Record-keeping, Mgmt. Quality)', bands: ['≥20', '≥15', '≥15', '≥10', '≥10', '≥8'], opts: ['Score 20 or more', 'Score 15 or more', 'Score 10 or more', 'Score 8 or more', 'Score below 8'], actual: 'Score 15 or more', tierFn: (v) => v === 'Score 20 or more' ? 1 : v === 'Score 15 or more' ? 3 : v === 'Score 10 or more' ? 5 : v === 'Score 8 or more' ? 6 : 'FAIL' },
      { key: 'auditor_quality', label: 'Auditor Quality', bands: ['Top 5', 'Grade A', 'Grade A', 'Grade B', 'Grade C', 'Audited'], opts: ['Top 5', 'Grade A', 'Grade B', 'Grade C', 'Audited', 'Below Audited'], actual: '', tierFn: (v) => v === 'Top 5' ? 1 : v === 'Grade A' ? 3 : v === 'Grade B' ? 4 : v === 'Grade C' ? 5 : v === 'Audited' ? 6 : 'FAIL' },
      { key: 'data_cons', label: 'Data Consistency (in-house vs. sales-breakdown vs. interviews)', bands: ['≥20', '≥15', '≥15', '≥10', '≥10', '≥8'], opts: ['Score 20 or more', 'Score 15 or more', 'Score 10 or more', 'Score 8 or more', 'Score below 8'], actual: 'Score below 8', tierFn: (v) => v === 'Score 20 or more' ? 1 : v === 'Score 15 or more' ? 3 : v === 'Score 10 or more' ? 5 : v === 'Score 8 or more' ? 6 : 'FAIL' },
    ],
  },
  {
    cat: 'Financials',
    rows: [
      { key: 'orr', label: "Obligor's Risk Rating (ORR)", bands: ['>3', '>4', '>5', '>6', '>6', '>7'], opts: ['Above 3', 'Above 4', 'Above 5', 'Above 6', 'Above 7'], actual: '', tierFn: (v) => v === 'Above 3' ? 1 : v === 'Above 4' ? 2 : v === 'Above 5' ? 3 : v === 'Above 6' ? 5 : v === 'Above 7' ? 6 : 'FAIL' },
      { key: 'rev_cagr', label: 'Annual Revenue Growth (3Y CAGR)', bands: ['5–10%', '10–15% or 3.5–5%', '15–20%', '20–25%', '20–25%', '25–30% or 1–3.5%'], actual: null, tierFn: identity },
      { key: 'net_margin', label: 'Min. Net Income Margin (Last 3Y)', bands: ['≥8.0%', '≥5.0%', '≥5.0%', '≥2.0%', '≥2.0%', '≥1.0%'], actual: 5, tierFn: identity },
      { key: 'debt_sales', label: 'Debt-to-Sales Ratio', bands: ['≤20%', '≤25%', '≤30%', '≤35%', '≤35%', '≤45%'], actual: null, tierFn: identity },
      { key: 'icr', label: 'Interest Coverage Ratio (Recasted)', bands: ['≥3.0x', '≥2.5x', '≥2.0x', '≥1.5x', '≥1.25x', '≥1.1x'], actual: null, tierFn: identity },
      { key: 'ccc', label: 'Cash Conversion Cycle', bands: ['≤60d', '≤75d', '≤90d', '≤120d', '≤120d', '≤150d'], actual: 3, tierFn: identity },
    ],
  },
  {
    cat: 'Bank Statement Analytics',
    rows: [
      { key: 'adb_pct', label: 'ADB % of Annualized Revenue Credits', bands: ['≥2.5%', '≥2.0%', '≥1.5%', '≥1.25%', '≥1.0%', '≥0.75%'], actual: null, tierFn: identity },
      { key: 'disc_cash_pct', label: 'Disclosed Cash % of Avg. Balance', bands: ['±5%', '±10%', '±10%', '±20%', '±20%', '±30%'], actual: null, tierFn: identity },
      { key: 'last3m_credits', label: 'Last 3M/6M Credits (cascading criteria)', bands: ['45–55%', '40–60%', '35–65%', '32.5–67.5%', '30–70%', '30–70%'], actual: null, tierFn: identity },
      { key: 'cheque_ret', label: 'Inward Cheque Returns (Last 6 mos.)', bands: ['≤1', '≤2', '≤3', '≤5', '≤7', '≤10'], actual: 1, tierFn: identity },
    ],
  },
  {
    cat: 'Debt Sustainability',
    rows: [
      { key: 'dss', label: 'Debt Sustainability Score', bands: ['≥90%', '≥80%', '≥70%', '≥50%', '≥50%', '≥40%'], opts: ['90 or more', '80 or more', '70 or more', '50 or more', '40 or more', 'Below 40'], actual: '', tierFn: (v) => v === '90 or more' ? 1 : v === '80 or more' ? 2 : v === '70 or more' ? 3 : v === '50 or more' ? 5 : v === '40 or more' ? 6 : 'FAIL' },
      { key: 'nbfc_debt_pct', label: 'NBFC % of Pre-Money Debt', bands: ['≤15%', '≤25%', '≤30%', '≤40%', '≤50%', '≤65%'], actual: null, tierFn: identity },
      { key: 'nbfc_inc', label: '% Increase in NBFC Debt (Last 6M)', bands: ['≤15%', '≤25%', '≤25%', '≤40%', '≤40%', '≤40%'], actual: null, tierFn: identity },
      { key: 'undisc_borrow', label: 'Undisclosed Borrowing % of Total', bands: ['≤15%', '≤25%', '≤25%', '≤35%', '≤35%', '≤45%'], actual: null, tierFn: identity },
      { key: 'dpd30', label: '30 DPD Instances (6mo-2yrs ago)', bands: ['≤1', '≤2', '≤2', '≤3', '≤3', '≤5'], actual: 2, tierFn: identity },
      { key: 'dpd60', label: '60 DPD Instances (6mo-2yrs ago)', bands: ['≤1', '≤2', '≤2', '≤3', '≤3', '≤3'], actual: 1, tierFn: identity },
      { key: 'dsc', label: 'Debt Service Capacity %', bands: ['≤20%', '≤30%', '≤40%', '≤50%', '≤60%', '≤65%'], opts: ['20 pct or less', '30 pct or less', '40 pct or less', '50 pct or less', '60 pct or less', '65 pct or less', 'More than 65 pct'], actual: '', tierFn: (v) => v === '20 pct or less' ? 1 : v === '30 pct or less' ? 2 : v === '40 pct or less' ? 3 : v === '50 pct or less' ? 4 : v === '60 pct or less' ? 5 : v === '65 pct or less' ? 6 : 'FAIL' },
    ],
  },
  {
    cat: 'Reference Checking',
    rows: [
      { key: 'nbfc_ref_exists', label: 'Non-bank Lender Reference Checks (≥1, largest NBFC)', mergedBand: 'At least 1 (largest NBFC)', opts: ['Yes', 'No', 'N/A'], actual: 'Yes', tierFn: (v) => v === 'Yes' ? 1 : v === 'N/A' ? 'N/A' : 'FAIL' },
      { key: 'nbfc_ref', label: 'NBFC Lender Reference Checks', mergedBand: 'No adverse findings', opts: ['Yes', 'No', 'N/A'], actual: 'Yes', tierFn: (v) => v === 'Yes' ? 1 : v === 'N/A' ? 'N/A' : 'FAIL' },
      { key: 'cust_ref', label: 'Customer Reference Checks', mergedBand: 'No adverse findings', opts: ['Yes', 'No', 'N/A'], actual: 'Yes', tierFn: (v) => v === 'Yes' ? 1 : v === 'N/A' ? 'N/A' : 'FAIL' },
      { key: 'supp_ref', label: 'Supplier Reference Checks', mergedBand: 'No adverse findings', opts: ['Yes', 'No', 'N/A'], actual: 'Yes', tierFn: (v) => v === 'Yes' ? 1 : v === 'N/A' ? 'N/A' : 'FAIL' },
      { key: 'quality_ih_fs', label: 'Quality of In-house Financial Summary', mergedBand: 'Assessment field (no stated threshold)', opts: ['Yes', 'No', 'N/A'], actual: 'Yes', tierFn: (v) => v === 'Yes' ? 1 : v === 'N/A' ? 'N/A' : 'FAIL' },
    ],
  },
];

export const APPETITE = [
  { notional: 'PHP 20,000,000', notionalNum: 20000000, tier: 'Tier 1', rev: 'Max 10%', revPct: .10, wallet: 'Max 25%', walletPct: .25, adb: '1.5x', adbFactor: 1.5, price: '2.25%/mo', tenor: '12 months' },
  { notional: 'PHP 15,000,000', notionalNum: 15000000, tier: 'Tier 2', rev: 'Max 10%', revPct: .10, wallet: 'Max 25%', walletPct: .25, adb: '1.5x', adbFactor: 1.5, price: '2.50%/mo', tenor: '12 months' },
  { notional: 'PHP 12,500,000', notionalNum: 12500000, tier: 'Tier 3', rev: 'Max 10%', revPct: .10, wallet: 'Max 25%', walletPct: .25, adb: '1.5x', adbFactor: 1.5, price: '2.75%/mo', tenor: '9 months' },
  { notional: 'PHP 10,000,000', notionalNum: 10000000, tier: 'Tier 4', rev: 'Max 10%', revPct: .10, wallet: 'Max 25%', walletPct: .25, adb: '1.5x', adbFactor: 1.5, price: '3.00%/mo', tenor: '9 months' },
  { notional: 'PHP 7,500,000', notionalNum: 7500000, tier: 'Tier 5', rev: 'Max 10%', revPct: .10, wallet: 'Max 25%', walletPct: .25, adb: '1.5x', adbFactor: 1.5, price: '3.25%/mo', tenor: '6 months' },
  { notional: 'PHP 5,000,000', notionalNum: 5000000, tier: 'Tier 6', rev: 'Max 10%', revPct: .10, wallet: 'Max 25%', walletPct: .25, adb: '1.5x', adbFactor: 1.5, price: '3.50%/mo', tenor: '6 months' },
];

export const DOC_TYPES = [
  { type: 'gis', tag: 'GIS', title: 'Corporate Registration', help: 'Latest GIS PDF — registration date, legal status, UBO & ownership.' },
  { type: 'ltr', tag: 'LTR', title: 'Large Transaction Report', help: 'Borrower Report Top Sheet — credits, borrowings, ADB & debt.' },
  { type: 'fs', tag: 'FS', title: 'Financial Spread', help: 'AFS / income statement / balance sheet, if separate.', multiple: true },
  { type: 'cbr', tag: 'CBR', title: 'Credit Bureau Report', help: 'DPD history, NBFC exposure & CIC report.' },
];

export const TRI_SOURCES = [
  { key: 'fin_aud', label: 'Financials (aud)' },
  { key: 'fin_ih', label: 'Financials (IH)' },
  { key: 'sales_bd', label: 'Sales Breakdown' },
  { key: 'ar_summ', label: 'AR Summ.' },
  { key: 'coll_rep', label: 'Collections Report' },
  { key: 'inv_rep', label: 'Inventory Report' },
  { key: 'bank', label: 'Bank Stat.' },
  { key: 'borrow', label: 'Borrowing Sheet' },
];

export const TRI_ANCHOR_HINT = 'Bank Stat. > Borrowing Sheet > sub-ledgers (AR, Sales, Collections, Inventory) > Financials (aud) > Financials (IH). Bank data is hardest to manipulate; borrower-prepared financials sit lowest.';

// Keys the server's /api/generate extraction (see server/lib/prompt.js for the
// full field-hint schema) returns that belong on `form` state, applied via
// setField. Every other key in a successful response is a rowValues key, keyed
// by the exact MANDATORY_ROWS / TIERING_CATS row key, applied via setRow.
export const GENERATED_FORM_KEYS = ['econGroup', 'obligorName', 'industry', 'regDate', 'legalStatus', 'revCredits', 'totalDebt', 'adb'];

// Returned by the model for any field it couldn't determine from the uploaded
// documents — never write this literal value into form/rowValues state.
export const USER_INPUT_SENTINEL = 'USER_INPUT';

export function getPHDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

export function defaultForm() {
  return {
    econGroup: '', obligorName: '', date: getPHDate(),
    rafType: '', regDate: '', legalStatus: '', industry: '',
    preparedBy: '', position: '',
    revCredits: '', totalDebt: '', adb: '', emiFactor: '',
    scoBy: '', scoDate: '', scoNotes: '', finalOverride: 'computed',
    proposedAmount: '', proposedPricing: '', proposedTenor: '',
  };
}

// The `actual` fields carried sample/demo values from the original prototype, and the
// `rowValues[key] ?? row.actual` reads could surface them as if entered (e.g. a Track
// Record of "10 or more years" on a company nobody scored). A live assessment must show
// untouched rows as "No data", so blank every sample value — the real value always comes
// from extraction or user input via rowValues, never from these placeholders.
MANDATORY_ROWS.forEach((r) => { r.actual = ''; });
TIERING_CATS.forEach((c) => c.rows.forEach((r) => { r.actual = ''; }));

export function defaultRowValues() {
  const rowValues = {};
  MANDATORY_ROWS.forEach((r) => { rowValues[r.key] = ''; });
  TIERING_CATS.forEach((cat) => cat.rows.forEach((r) => {
    rowValues[r.key] = '';
    // every tiering row is overridable now (judgement note + tier override)
    rowValues[r.key + '_tier_override'] = 'computed';
    rowValues[r.key + '_note'] = '';
  }));
  rowValues.reg_date = defaultForm().regDate;
  rowValues.legal_status = defaultForm().legalStatus;
  rowValues.final_tier_override = 'computed';
  return rowValues;
}

export function defaultTriItems() {
  return [
    { id: 'sales', label: 'Sales', applicable: 'Yes', anchor: 'bank', vals: {} },
    { id: 'collections', label: 'Collections', applicable: 'Yes', anchor: 'bank', vals: {} },
    { id: 'cash', label: 'Cash', applicable: 'Yes', anchor: 'bank', vals: {} },
    { id: 'ar', label: 'AR', applicable: 'Yes', anchor: 'ar_summ', vals: {} },
    { id: 'inventory', label: 'Inventory', applicable: 'Yes', anchor: 'inv_rep', vals: {} },
    { id: 'debt', label: 'Debt', applicable: 'Yes', anchor: 'bank', vals: {} },
  ];
}

// ── parse helpers ──
export function parseMoney(v) {
  const t = String(v || '').toLowerCase().replace(/,/g, '');
  const m = t.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  let n = Number(m[0]);
  if (t.includes('bn') || t.includes('billion')) n *= 1e9;
  else if (t.includes('m') || t.includes('million')) n *= 1e6;
  else if (t.includes('k') || t.includes('thousand')) n *= 1e3;
  return Number.isFinite(n) ? n : null;
}
export function parsePct(v) {
  const m = String(v || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}
export function parseDate(v) {
  const t = String(v || '').trim();
  if (!t || t === '--') return null;
  const d = Date.parse(t);
  if (!Number.isNaN(d)) return new Date(d);
  const p = t.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ](\d{2,4})$/);
  if (!p) return null;
  const mo = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(p[2].slice(0, 3).toLowerCase());
  if (mo < 0) return null;
  const y = Number(p[3].length === 2 ? '20' + p[3] : p[3]);
  return new Date(y, mo, Number(p[1]));
}
export function formatPHP(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '--';
  return 'PHP ' + Math.round(v).toLocaleString('en-US');
}

// ── badges ──
export function tbadge(t) {
  if (t === 'NODATA') return { text: 'No data', bg: '#eef1f5', fg: '#8a97a6' };
  if (t === 'FAIL') return { text: 'FAIL', bg: '#fbe8e4', fg: '#c0392b' };
  if (t === 'N/A' || !t) return { text: 'N/A', bg: '#eef1f5', fg: '#54616e' };
  const c = { 1: ['#e8f1f8', '#1f5a83'], 2: ['#ebf5e9', '#3d8a36'], 3: ['#fbf0df', '#b06f1a'], 4: ['#fdecdf', '#b5591a'], 5: ['#fbe8e4', '#c0392b'], 6: ['#f6e3e8', '#7a1f3d'] }[t] || ['#eef1f5', '#54616e'];
  return { text: 'Tier ' + t, bg: c[0], fg: c[1] };
}

// ── mandatory ──
export function mandPass(row, val) {
  if (val === undefined || val === '') return null;
  if (row.key === 'credit_check') return val === '0';
  if (row.key === 'nbfc_exp') { const p = parsePct(val); return p === null ? null : p <= 65; }
  if (row.key === 'reg_date') { const d = parseDate(val); return d ? d < new Date(2023, 6, 1) : null; }
  if (row.key === 'min_rev') { const a = parseMoney(val); return a === null ? null : a >= 100000000; }
  return val === 'Yes';
}
export function mandBadgeFor(row, val) {
  const p = mandPass(row, val);
  return p === null ? { text: 'No data', bg: '#eef1f5', fg: '#8a97a6' } : p ? { text: 'PASS', bg: '#ebf5e9', fg: '#3d8a36' } : { text: 'FAIL', bg: '#fbe8e4', fg: '#c0392b' };
}

// ── tiering ──
export function rowTier(row, catName, rowValues) {
  // Judgement override applies to every tiering row (not just Corporate Governance).
  const ov = rowValues[row.key + '_tier_override'] || 'computed';
  if (ov && ov !== 'computed') return (ov === 'FAIL' || ov === 'N/A') ? ov : Number(ov);
  const val = rowValues[row.key] ?? row.actual;
  if (val === undefined || val === '' || val === null) return 'NODATA';
  return row.tierFn(val);
}

export function getLimit(appetite, form) {
  if (!appetite) return { prescribed: null, rows: [] };
  const rev = parseMoney(form.revCredits), debt = parseMoney(form.totalDebt), adb = parseMoney(form.adb);
  const emi = Number(form.emiFactor || appetite.adbFactor || 1.5);
  const rows = [
    { label: 'By Final Risk Tier', value: appetite.notionalNum, available: true },
    { label: 'By % of Obligor Revenue Credits', value: rev === null ? null : rev * appetite.revPct, available: rev !== null },
    { label: 'By % of Total Borrowing (Wallet)', value: debt === null ? null : debt * appetite.walletPct, available: debt !== null },
    { label: 'By Min ADB × EMI Factor', value: adb === null ? null : adb * emi, available: adb !== null },
  ];
  const avail = rows.filter((r) => r.available && Number.isFinite(r.value)).map((r) => r.value);
  return { prescribed: avail.length ? Math.min(...avail) : null, rows };
}

export function compute(rowValues, form) {
  const mandAnswered = MANDATORY_ROWS.some((row) => { const v = rowValues[row.key] ?? row.actual; return v !== undefined && v !== ''; });
  let mandFail = false;
  MANDATORY_ROWS.forEach((row) => { const v = rowValues[row.key] ?? row.actual; if (mandPass(row, v) === false) mandFail = true; });
  const mandResult = mandFail ? 'FAIL' : mandAnswered ? 'PASS' : 'No data';

  const catResults = {}; let worstNum = 0; let tierAnswered = false;
  TIERING_CATS.forEach((cat) => {
    let catWorst = 0, hasFail = false;
    cat.rows.forEach((row) => {
      const v = rowValues[row.key] ?? row.actual;
      if (v !== undefined && v !== '' && v !== null) tierAnswered = true;
      const t = rowTier(row, cat.cat, rowValues);
      if (t === 'FAIL') hasFail = true; else if (t !== 'N/A' && t !== 'NODATA' && typeof t === 'number') catWorst = Math.max(catWorst, t);
    });
    catResults[cat.cat] = hasFail ? 'FAIL' : (catWorst || 'N/A');
    if (hasFail) worstNum = 99; else if (typeof catResults[cat.cat] === 'number') worstNum = Math.max(worstNum, catResults[cat.cat]);
  });
  const worstTier = worstNum === 99 ? 'FAIL' : (worstNum || (tierAnswered ? 'N/A' : 'NODATA'));
  const ov = rowValues.final_tier_override || 'computed';
  const finalTier = ov === 'computed' ? worstTier : ov === 'FAIL' ? 'FAIL' : Number(ov);
  const finalOverridden = ov !== 'computed';
  const finalNum = typeof finalTier === 'number' ? finalTier : null;
  const failCount = Object.values(catResults).filter((v) => v === 'FAIL').length;
  let approvalText = failCount > 2 ? 'CEO and CLO Approval Required' : 'CLO Approval Required';
  if (finalOverridden) approvalText = 'SCO Approval Required' + (failCount > 2 ? ' + CEO and CLO' : '');
  const appetite = finalNum ? APPETITE[finalNum - 1] : null;
  const limit = getLimit(appetite, form);
  const prescribed = (limit.prescribed === null && appetite) ? appetite.notionalNum : limit.prescribed;
  return { mandFail, mandResult, catResults, worstTier, finalTier, finalNum, finalOverridden, approvalText, appetite, limit, prescribed, exceptions: failCount };
}

// ── category summary (Tier1-6 / FAIL / N/A tallies per category, for the Risk Tiering Framework Summary table) ──
export function categoryBreakdown(rowValues) {
  return TIERING_CATS.map((cat) => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, FAIL: 0, NA: 0 };
    let answered = 0;
    cat.rows.forEach((row) => {
      const v = rowValues[row.key] ?? row.actual;
      if (v !== undefined && v !== '' && v !== null) answered++;
      const t = rowTier(row, cat.cat, rowValues);
      if (t === 'FAIL') counts.FAIL++;
      else if (t === 'N/A' || t === 'NODATA') counts.NA++;
      else if (typeof t === 'number') counts[t]++;
    });
    const hasFail = counts.FAIL > 0;
    const maxTier = [6, 5, 4, 3, 2, 1].find((n) => counts[n] > 0) || null;
    const tierResult = hasFail ? 'FAIL' : (maxTier || 'N/A');
    const status = answered === 0 ? 'Not started' : answered === cat.rows.length ? 'Complete' : 'Incomplete';
    return { cat: cat.cat, counts, tierResult, status, inputs: cat.rows.length };
  });
}

// ── proposed terms vs risk appetite thresholds (Final Risk Tiering - Metric/Value/Status table) ──
export function getFinalMetrics(form, c) {
  if (!c.appetite) return [];
  const minPricing = parsePct(c.appetite.price);
  const maxTenor = parsePct(c.appetite.tenor);
  const propAmount = parseMoney(form.proposedAmount);
  const propPricing = parsePct(form.proposedPricing);
  const propTenor = parsePct(form.proposedTenor);
  return [
    {
      label: 'Maximum Limit', value: propAmount === null ? null : formatPHP(propAmount),
      status: propAmount === null ? null : (propAmount <= c.prescribed ? 'Within Threshold' : 'Exceeds Threshold'),
    },
    {
      label: 'Minimum Pricing (Monthly)', value: propPricing === null ? null : `${propPricing.toFixed(2)}%`,
      status: propPricing === null ? null : (propPricing >= minPricing ? 'Within Threshold' : 'Below Threshold'),
    },
    {
      label: 'Max. Tenor', value: propTenor === null ? null : `${propTenor.toFixed(2)} months`,
      status: propTenor === null ? null : (propTenor <= maxTenor ? 'Within Threshold' : 'Exceeds Threshold'),
    },
  ];
}

// ── financial data triangulator (anchor-based, coverage-adjusted) ──
export function triNum(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === '' || /^n\/?a$/i.test(s)) return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}
export function triScoreBadge(a) {
  if (a === 'Excluded') return { text: 'Excluded', bg: '#eef1f5', fg: '#54616e' };
  if (a === 'N/A' || a === null || a === undefined) return { text: 'N/A', bg: '#eef1f5', fg: '#54616e' };
  const m = { 5: ['#ebf5e9', '#3d8a36'], 4: ['#eaf4e6', '#4e8a2f'], 3: ['#fbf0df', '#b06f1a'], 2: ['#fdecdf', '#b5591a'], 1: ['#fbe8e4', '#c0392b'] }[a] || ['#eef1f5', '#54616e'];
  return { text: String(a), bg: m[0], fg: m[1] };
}
export function computeTri(triItems) {
  const N = TRI_SOURCES.length;
  const rows = triItems.map((item) => {
    const applicable = item.applicable !== 'No';
    const nums = {}; let count = 0;
    TRI_SOURCES.forEach((s) => { const n = triNum(item.vals[s.key]); nums[s.key] = n; if (n !== null) count++; });
    const coverage = count / N;
    let anchorNum = nums[item.anchor]; if (anchorNum === undefined) anchorNum = null;
    let maxDev = null;
    if (anchorNum !== null) {
      const devs = [];
      TRI_SOURCES.forEach((s) => { if (s.key === item.anchor) return; const n = nums[s.key]; if (n === null) return; let d; if (anchorNum === 0) d = (n === 0 ? 0 : 1); else d = Math.abs(n - anchorNum) / Math.abs(anchorNum); devs.push(d); });
      if (devs.length) maxDev = Math.max(...devs);
    }
    let raw = null;
    if (maxDev !== null) raw = maxDev <= 0.2 ? 5 : maxDev <= 0.4 ? 4 : maxDev <= 0.7 ? 3 : maxDev <= 1 ? 2 : 1;
    const covLow = coverage < 0.5;
    let adjusted;
    if (!applicable) adjusted = 'Excluded';
    else if (raw === null) adjusted = 'N/A';
    else adjusted = covLow ? Math.min(raw, 3) : raw;
    return { item, applicable, anchorNum, count, coverage, maxDev, raw, covLow, adjusted };
  });
  const scored = rows.filter((r) => typeof r.adjusted === 'number');
  const avg = scored.length ? scored.reduce((a, r) => a + r.adjusted, 0) / scored.length : null;
  return { rows, avg: (avg === null ? null : Math.round(avg * 10) / 10), final: (avg === null ? null : Math.round(avg)), scoredCount: scored.length, excludedCount: rows.filter((r) => r.adjusted === 'Excluded').length, naCount: rows.filter((r) => r.adjusted === 'N/A').length };
}
