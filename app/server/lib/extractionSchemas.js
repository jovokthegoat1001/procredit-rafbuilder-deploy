// Per-document extraction schemas for the RAF auto-population pipeline.
//
// This is the canonical extraction contract (pipeline 0.1-draft): Claude extracts
// RAW values only — every ratio, gap, DPD count, and tier is computed downstream in
// mapExtraction.js + tiering.js, never by the model. Each document type has its own
// focused schema and is extracted in its own API call (see routes/generate.js), so
// the model only ever sees one document's worth of context at a time.
//
// Every scalar leaf is returned as { value, unit, source_page, confidence, note? }.
// Array-of-record fields (stockholders, monthly_stats, …) use plain typed values per
// record to keep output manageable, with an array-level source_page/confidence where
// useful. Anything not found is returned as null with a note — never guessed.

// The full schema as authored, kept in-repo as the source-of-truth contract. The
// prompts below are derived from it; this object is exported for documentation,
// validation tooling, and so a future pipeline version can diff against it.
export const EXTRACTION_SCHEMA = {
  pipeline_version: '0.1-draft',
  description:
    'Per-document-type extraction schemas for the RAF auto-population pipeline. Claude extracts RAW values only; all ratios/gaps/tiering are computed downstream by the system. Every extracted field must carry source_page and confidence (high/medium/low). Fields not found must be returned as null with a note, never guessed.',
  global_output_envelope: {
    document_type: 'string (one of the schema keys below)',
    obligor_name_on_document: 'string',
    document_date: 'ISO date',
    extraction_warnings: ['list of data-quality flags, e.g. missing pages, illegible values, mismatched totals'],
    fields: 'object per schema below, each leaf = {value, unit, source_page, confidence, note?}',
  },
  schemas: {
    GIS: {
      feeds_raf: ['Date of Original Business Registration', 'Obligor Legal Status', 'Ownership Structure %', 'Known UBO', 'GIS up-to-date check', 'Auditor name (secondary source)'],
    },
    AFS_FINANCIAL_SUMMARY: {
      feeds_raf: ['Min. Annual Revenue screen (needs P&L)', '3Y CAGR', 'Net Income Margin', 'ICR', 'CCC', 'Audited/IH gaps', 'Pro Forma Debt/FS Debt Gap', 'Auditor Quality'],
    },
    IH_FINANCIAL_SUMMARY: {
      feeds_raf: ['All IH-gap criteria (audited/IH, revenue credits/IH, sales breakdown/IH)', 'Disclosed cash for LTR comparison', 'Pro forma debt gap', 'Quality of IH Financial Summary'],
    },
    LTR_BANK_STATEMENT_BORROWING_REPORT: {
      feeds_raf: ['ADB % of annualized revenue credits', 'Last 3M/6M credits', 'Inward cheque returns', 'Disclosed cash %', 'Debt sustainability inputs', 'NBFC % of pre-money debt', '% increase in NBFC debt 6M', 'Undisclosed borrowing %', 'Debt service capacity', 'Qualified borrowing history', 'NBFC exposure screen'],
    },
    CBR_SUMMARY: {
      feeds_raf: ['Credit Check last 6 months (screen)', 'NFIS screen', 'Background screening', '30/60 DPD instances 6-24 months', 'Undisclosed borrowing cross-check', 'NBFC exposure cross-check'],
    },
  },
};

// The app's upload doc types map to one or more schema keys. The "fs" (Financial
// Spread) upload commonly contains BOTH audited and in-house columns for the same
// year — the audited/in-house gap criteria need them side by side — so its schema
// merges AFS + IH into audited/in_house sub-sections of one envelope.
export const DOC_SCHEMA_KEYS = {
  gis: ['GIS'],
  ltr: ['LTR_BANK_STATEMENT_BORROWING_REPORT'],
  fs: ['AFS_FINANCIAL_SUMMARY', 'IH_FINANCIAL_SUMMARY'],
  cbr: ['CBR_SUMMARY'],
};

const ENVELOPE_RULES = `Return ONLY valid JSON — no markdown, no prose outside the object. Wrap the result in this envelope:
{
  "document_type": "<the schema key for this document>",
  "obligor_name_on_document": "<company/registered name exactly as printed>",
  "document_date": "<ISO date of the document, YYYY-MM-DD>",
  "extraction_warnings": ["<data-quality flags: missing pages, illegible values, mismatched totals, stale document, etc.>"],
  "fields": { <the fields object for this document, per the shape below> }
}

Rules:
- Extract RAW values only. Do NOT compute ratios, gaps, growth rates, tiers, or pass/fail — those are computed downstream by the system.
- Every SCALAR leaf inside "fields" must be an object: {"value": <number|string|boolean|null>, "unit": "<e.g. PHP, PHP '000, %, days, count, or null>", "source_page": <page number or label, or null>, "confidence": "high|medium|low", "note": "<optional>"}.
- Arrays of records (stockholders, monthly_stats, borrowing_detail, delinquencies, …) use plain typed values per record — do NOT wrap each cell in the {value,...} object. Instead add "source_page" and "confidence" as plain sibling keys on each record where you can.
- Any field you cannot find: return its "value" as null with a "note" explaining why (e.g. "page not in document", "illegible"). NEVER guess or carry over example data.
- If a table has several date/period columns, read the actual calendar date in each header and keep them straight — never blend two columns. Preserve the source's own numeric scale but state it in "unit" (e.g. if the header says "IN PESO '000", set unit to "PHP '000" and keep the printed figure as-is; do not multiply).
- Only report facts actually present in THIS document.`;

function json(shape) {
  return JSON.stringify(shape, null, 2);
}

const GIS_FIELDS = {
  sec_registration_no: 'leaf',
  date_registered: 'leaf (date of ORIGINAL business registration, YYYY-MM-DD)',
  corporate_name: 'leaf',
  company_type: 'leaf (Stock Corporation / One Person Corporation (OPC) / Partnership / Sole Proprietorship / etc.)',
  gis_for_year: 'leaf (integer year this GIS covers)',
  actual_annual_meeting_date: 'leaf (date)',
  principal_office_address: 'leaf',
  tin: 'leaf',
  external_auditor_name: 'leaf (auditing firm named in the GIS, if any)',
  industry_classification: 'leaf',
  primary_purpose: 'leaf',
  parent_company: 'leaf|null',
  subsidiaries_affiliates: '[strings]',
  total_assets_per_latest_afs: 'leaf (PHP)',
  authorized_capital: 'leaf (PHP)',
  subscribed_capital: 'leaf (PHP)',
  paid_up_capital: 'leaf (PHP)',
  stockholders: '[ {name, nationality, shares, amount_php, ownership_pct, tin, source_page, confidence} ]',
  directors_officers: '[ {name, position, board_role (C/M/I), is_stockholder (boolean), tin, source_page, confidence} ]',
  beneficial_owners: '[ {name, ownership_pct, type (Direct|Indirect), category (A-I), date_of_birth, source_page, confidence} ]',
  notarization_date: 'leaf (date)',
};

const FS_FIELDS = {
  fiscal_years_covered: '[ "FY-YYYY", ... ]',
  currency_unit: "leaf (e.g. \"PHP '000\")",
  audit_status_per_year: 'object mapping each FY to "AUDITED" or "IN-HOUSE"',
  audited: {
    _comment: 'the AUDITED figures. Omit / null any year not audited.',
    income_statement_per_year: '{ "FY-YYYY": { revenue, cogs, gross_profit, ebit, interest_expense, net_income } } — plain numbers per year. Put the TOP-LINE sales figure in "revenue" whatever the statement labels it (Revenue / Sales / Net Sales / Gross Sales / Turnover / Sales Revenue).',
    balance_sheet_per_year: '{ "FY-YYYY": { cash_and_equivalents, trade_receivables, other_current_assets, total_current_assets, inventory, property_and_equipment_net, total_noncurrent_assets, total_assets, trade_payables, other_current_liabilities, loans_payable_current, total_current_liabilities, due_to_affiliates, loans_payable_noncurrent, total_noncurrent_liabilities, total_liabilities, paid_up_capital, retained_earnings, total_equity, balance_check } }',
  },
  in_house: {
    _comment: 'the IN-HOUSE figures for the same years, if the spread shows them alongside.',
    income_statement_per_year: 'same structure as audited.income_statement_per_year',
    balance_sheet_per_year: 'same structure as audited.balance_sheet_per_year, plus PPE sub-items where shown (transport, machinery, real_estate, others)',
    working_capital_days: '{ days_inventory, days_receivable, days_payable } — plain numbers, or null with note if #DIV/0!/#REF!',
  },
  notes_and_disclosures: '[ {item (e.g. named bank loan in notes), amount, source_page} ]',
  auditor_name: 'leaf (from the audit opinion page, if present)',
};

const LTR_FIELDS = {
  client: 'leaf',
  report_date: 'leaf (date)',
  prepared_by: 'leaf',
  checked_by: 'leaf',
  annualized_revenue_credits: 'leaf (PHP)',
  monthly_stats: '[ {month "YYYY-MM", total_credits, loan_disbursals, cash_deposits, internal_transfers, returns, highlighted_unknowns, revenue_credits, avg_daily_balance, min_balance, max_balance, source_page, confidence} — one record per month, oldest first ]',
  cheque_activity_monthly: '[ {month "YYYY-MM", customer_bounces_count, customer_bounces_value, outward_returns_count, outward_returns_value, stop_orders_count, stop_orders_value} — one record per month, oldest first ]',
  debt_estimates: {
    as_of_dates: '[ "YYYY-MM-DD", "YYYY-MM-DD" ] — the estimate columns, in the order the arrays below use',
    total_debt: '[ number per as_of date, same order ]',
    total_monthly_repayment_p_plus_i: '[ number per as_of date ]',
    total_interest: '[ number per as_of date ]',
    bank_debt: '[ number per as_of date ]',
    non_bank_debt_unsecured: '[ number per as_of date ]',
    non_bank_debt_secured: '[ number per as_of date ]',
    disclosed_debt: '[ number per as_of date ]',
  },
  bank_accounts: '[ {bank, account_number, pct_of_credits} ]',
  borrowing_detail: '[ {lender, loan_amount, type, start_date, maturity_date|null, classification (Bank|Non-Bank Unsecured|Non-Bank Secured), rate, monthly_repayment, avg_monthly_interest, outstanding_latest, in_cic (boolean), disclosure_status (DISCLOSED|IN_CIC_ONLY|BANK_STAT_ONLY), source_page} ]',
  txn_clarification_list: '[ {txn_id, date, account, description, amount, tag, resolution|null} ]',
  issues_and_clarifications: '[ strings ]',
  missing_statements: '[ strings — banks/entities whose statements are absent ]',
};

const CBR_FIELDS = {
  borrower: 'leaf',
  report_date: 'leaf (date)',
  linked_entities: '[ strings — related persons/companies covered ]',
  nfis: '{ hit (boolean), findings: [strings], source_page, confidence }',
  namescan: '{ hit (boolean), findings: [strings], source_page, confidence }',
  crif_court_cases: '[ {subject, plaintiff, case_no, nature, date} ]',
  cic_delinquencies: '[ {subject, provider, principal_or_pdo_amount, dpd_event_month "YYYY-MM", cycles (integer: 1 = 30 DPD, 2 = 60 DPD, ...), remarks (CURRENT|PAST DUE|CLOSED|BLOCKED|...), is_company (boolean: true if this is the obligor company, false if a principal/personal account), source_page} ]',
  facilities: '[ {subject, lender, contract_type, financed_amount_or_limit, start_date "YYYY-MM", end_date "YYYY-MM"|null, status (CURRENT|CLOSED), settled_date|null, category (INSTALLMENT|NON-INSTALLMENT|CREDIT_CARD)} ]',
  summary_findings: 'leaf',
  action_plan: 'leaf',
  signatories: '{ written_by, follow_up_by, approved_by }',
};

const VALIDATION = {
  GIS: [
    'sum(stockholders.ownership_pct) should equal 100 — add an extraction_warning if it does not.',
    'gis_for_year should be at least (current year - 1); if older, add an extraction_warning that the GIS is stale.',
  ],
  FS: [
    'For each year, balance_sheet.balance_check should be 0 (total_assets = total_liabilities + total_equity) — warn otherwise.',
    'Loans named in notes_and_disclosures should reconcile with loans_payable lines — warn on mismatch.',
    'If a year shows #DIV/0! / #REF! or an all-zero column, return those leaves as null with a note and warn "year not provided" rather than recording zeros.',
  ],
  LTR: [
    'Return months with no data as absent from monthly_stats (do not record zeros) and warn which months are uncovered.',
    'Large "Unknown"-tagged credits reduce revenue-credit reliability — surface as an extraction_warning.',
    'Note any banks/entities whose statements are missing in missing_statements.',
  ],
  CBR: [
    'Tag each cic_delinquency with is_company so company vs. principal (personal) delinquencies can be separated downstream.',
    'Record the exact dpd_event_month and cycles for every delinquency — the downstream system counts 30/60 DPD instances by date window, so do not pre-filter by date.',
  ],
};

function fieldsBlock(docType) {
  if (docType === 'gis') return json(GIS_FIELDS);
  if (docType === 'fs') return json(FS_FIELDS);
  if (docType === 'ltr') return json(LTR_FIELDS);
  if (docType === 'cbr') return json(CBR_FIELDS);
  return '{}';
}

const SCHEMA_KEY_LABEL = {
  gis: 'GIS',
  fs: 'AFS_FINANCIAL_SUMMARY + IH_FINANCIAL_SUMMARY (combined financial spread)',
  ltr: 'LTR_BANK_STATEMENT_BORROWING_REPORT',
  cbr: 'CBR_SUMMARY',
};

const DOC_INTRO = {
  gis: 'This is a SEC General Information Sheet (GIS) / DTI registration. Extract corporate registration, ownership, and beneficial-owner facts.',
  fs: 'This is a Financial Spread — it may contain AUDITED and IN-HOUSE figures for the same fiscal years. Extract both series so the audited-vs-in-house gaps can be computed downstream. The income-statement lines (revenue, ebit, interest_expense, net_income) are REQUIRED for the revenue/margin/ICR/sales-gap criteria — extract them wherever a profit-and-loss / income statement / sales line is present. IMPORTANT: the top-line sales figure may be labeled "Revenue", "Sales", "Net Sales", "Gross Sales", "Turnover", or "Sales Revenue" — always capture it under "revenue" regardless of the exact label, for both the audited and in-house series.',
  ltr: 'This is a Large Transaction Report / borrower report (bank-statement analytics + borrowing estimates). Extract the monthly bank-stat table, cheque activity, the debt-estimates summary (per as-of date), and the disclosed-borrowing detail.',
  cbr: 'This is a Credit Bureau Report (CIC / NFIS / Namescan / CRIF). Extract NFIS/Namescan hits, court cases, every delinquency event with its month and DPD cycle count, and the facilities list.',
};

// Build the full extraction prompt for one uploaded document type.
export function buildDocPrompt(docType) {
  const intro = DOC_INTRO[docType] || 'Extract the fields below from this document.';
  const rules = (VALIDATION[docType === 'fs' ? 'FS' : docType.toUpperCase()] || []).map((r) => `- ${r}`).join('\n');
  return `You are extracting data for a credit risk assessment (RAF) from ONE source document.

${intro}

document_type for this extraction: "${SCHEMA_KEY_LABEL[docType]}"

${ENVELOPE_RULES}

The "fields" object for THIS document must follow this shape (types/labels are hints, not literal values):
${fieldsBlock(docType)}

Document-specific data-quality checks:
${rules || '- (none)'}
`;
}
