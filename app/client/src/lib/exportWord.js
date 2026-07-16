// Renders the RAF assessment as print-ready HTML matching the "RISK ASSESSMENT
// FRAMEWORK – STANDARD" template: mandatory screening table, the Tier1-6 risk
// tiering matrix, the category summary, final risk tier box, risk appetite
// framework, and the prepared-by / credit-committee sign-off.
import * as raf from './rafEngine';

function esc(s) {
  return String(s == null ? '—' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const NAVY = '#0c2f47';
const BLUE = '#2a75a8';
const GREEN = '#2e7d32';
const RED = '#c0392b';
const INK = '#1a2733';
const MUTE = '#5a6b7a';

const SECTION_BAR = `background-color:${NAVY};color:#fff;font-weight:bold;font-size:8.5pt;line-height:1.15;padding:3pt 6pt;font-family:Calibri,sans-serif;text-align:center;`;
const TBL = 'border-collapse:collapse;width:100%;margin:0 0 5pt;font-family:Calibri,sans-serif;';
const TH = `background-color:${BLUE};color:#fff;padding:2pt 5pt;font-weight:bold;border:1px solid #9db7c9;font-size:6.5pt;line-height:1.15;text-align:left;`;
const TD = 'padding:2pt 5pt;border:1px solid #ccd3da;vertical-align:middle;font-size:6.5pt;line-height:1.15;color:' + INK + ';';
const CAT_ROW = `background-color:#eaf1f6;font-weight:bold;font-size:7pt;line-height:1.15;color:${NAVY};padding:2pt 5pt;border:1px solid #ccd3da;`;

function pill(text, color) {
  return `<span style="display:inline-block;padding:0.5pt 5pt;border-radius:8pt;font-weight:bold;font-size:6.5pt;color:#fff;background-color:${color};">${esc(text)}</span>`;
}
function passFailPill(pass) {
  if (pass === null) return pill('No data', '#8a97a6');
  return pass ? pill('PASS', GREEN) : pill('FAIL', RED);
}
function tierPill(t) {
  if (t === 'FAIL') return pill('FAIL', RED);
  if (t === 'N/A' || t === 'NODATA' || !t) return pill('N/A', '#8a97a6');
  const colors = { 1: '#1f5a83', 2: '#3d8a36', 3: '#b06f1a', 4: '#b5591a', 5: RED, 6: '#7a1f3d' };
  return pill('Tier ' + t, colors[t] || '#5a6b7a');
}

function td(content, extra) {
  return `<td style="${TD}${extra || ''}">${content}</td>`;
}

const LABEL_TD = 'padding:2.5pt 6pt;border:1px solid #ccd3da;background-color:#eef1f5;font-weight:bold;font-size:6.5pt;line-height:1.15;text-transform:uppercase;letter-spacing:.02em;color:' + NAVY + ';width:16%;';
const VALUE_TD = 'padding:2.5pt 6pt;border:1px solid #ccd3da;font-size:7.5pt;line-height:1.15;color:' + INK + ';width:34%;';

function infoRow(pairs) {
  return `<tr>${pairs.map(([label, value]) => `<td style="${LABEL_TD}">${esc(label)}</td><td style="${VALUE_TD}">${esc(value)}</td>`).join('')}</tr>`;
}

let logoDataUrlPromise = null;
function getLogoDataUrl() {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetch('/procredit-logo.png')
      .then((r) => r.blob())
      .then((blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }))
      .catch(() => null);
  }
  return logoDataUrlPromise;
}

function headerBlock(logoDataUrl, form, titleText, subtitleText) {
  let h = '';
  h += `<table style="${TBL}margin-bottom:4pt;"><tr>
    <td style="border:none;padding:0;vertical-align:middle;width:50%;">
      ${logoDataUrl ? `<img src="${logoDataUrl}" alt="ProCredit Financing Corp" style="height:22px;width:auto;display:block;" />` : `<div style="font-size:11pt;font-weight:bold;color:${NAVY};">ProCredit <span style="font-weight:normal;color:${MUTE};">Financing Corp</span></div>`}
    </td>
    <td style="border:none;padding:0;text-align:right;vertical-align:bottom;font-size:6.5pt;color:${MUTE};">
      <div><b>TYPE:</b> Date &ndash; ${esc(form.date)}</div>
      <div><b>Version:</b> [date approved]</div>
    </td>
  </tr></table>`;
  if (titleText) {
    h += `<div style="background-color:${NAVY};color:#fff;font-weight:bold;font-size:11pt;padding:4pt;text-align:center;font-family:Calibri,sans-serif;">${esc(titleText)}</div>`;
    if (subtitleText) h += `<div style="font-size:6.5pt;font-style:italic;color:${MUTE};text-align:center;margin:2pt 0 4pt;">${esc(subtitleText)}</div>`;
  }
  h += `<table style="${TBL}"><tbody>
    ${infoRow([['Obligor Name', form.obligorName], ['Date', form.date]])}
    ${infoRow([['Economic Group', form.econGroup], ['Prepared By', form.preparedBy]])}
  </tbody></table>`;
  return h;
}

function adjustedColor(a) {
  if (a === 'Excluded' || a === 'N/A' || a === null || a === undefined) return '#8a97a6';
  const m = { 5: '#3d8a36', 4: '#4e8a2f', 3: '#b06f1a', 2: '#b5591a', 1: RED };
  return m[a] || '#5a6b7a';
}

// ── financial data triangulator table (wide — meant to be printed landscape) ──
function buildTriBodyHtml(form, triItems, logoDataUrl, opts) {
  opts = opts || {};
  const t = raf.computeTri(triItems);
  const fmtNum = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('en-US'));

  let b = '';
  if (opts.includeHeader) {
    // titleText omitted — the table's own thead already repeats the "FINANCIAL DATA
    // TRIANGULATOR" bar on every printed page, so a separate title here would be redundant.
    b += headerBlock(logoDataUrl, form, null, null);
    b += `<div style="font-size:8.5pt;font-style:italic;color:${MUTE};margin:0 0 4pt;">Every source compared to a chosen anchor per line item &mdash; coverage-adjusted, worst-outlier scoring. Values in Peso '000.</div>`;
  }

  const triColCount = raf.TRI_SOURCES.length + 11;
  b += `<table style="${TBL}"><thead>
    <tr><th colspan="${triColCount}" style="${SECTION_BAR}">FINANCIAL DATA TRIANGULATOR</th></tr>
    <tr>
      <th style="${TH}">Line Item</th>
      <th style="${TH}text-align:center;">Appl.</th>
      ${raf.TRI_SOURCES.map((s) => `<th style="${TH}text-align:right;">${esc(s.label)}</th>`).join('')}
      <th style="${TH}">Anchor Source</th>
      <th style="${TH}text-align:right;">Anchor Value</th>
      <th style="${TH}text-align:center;">Sources</th>
      <th style="${TH}text-align:center;">Coverage</th>
      <th style="${TH}text-align:right;">Max Dev %</th>
      <th style="${TH}text-align:center;">Raw</th>
      <th style="${TH}text-align:center;">Flag</th>
      <th style="${TH}text-align:center;">Adjusted</th>
    </tr>
  </thead><tbody>`;
  t.rows.forEach((r) => {
    const anchorSrc = raf.TRI_SOURCES.find((s) => s.key === r.item.anchor);
    const cells = raf.TRI_SOURCES.map((s) => {
      const v = r.item.vals[s.key];
      const isAnchor = s.key === r.item.anchor;
      return td(esc(v != null && v !== '' ? v : '—'), 'text-align:right;' + (isAnchor ? 'background-color:#eaf6ea;' : ''));
    }).join('');
    b += `<tr>${td(esc(r.item.label))}${td(esc(r.item.applicable), 'text-align:center;')}${cells}` +
      `${td(esc(anchorSrc ? anchorSrc.label : r.item.anchor))}${td(fmtNum(r.anchorNum), 'text-align:right;')}` +
      `${td(`${r.count} / ${raf.TRI_SOURCES.length}`, 'text-align:center;')}${td(Math.round(r.coverage * 100) + '%', 'text-align:center;')}` +
      `${td(r.maxDev === null ? 'N/A' : (r.maxDev * 100).toFixed(1) + '%', 'text-align:right;')}${td(r.raw === null ? 'N/A' : String(r.raw), 'text-align:center;')}` +
      `${td(pill(r.covLow ? 'Low' : 'OK', r.covLow ? '#b06f1a' : GREEN), 'text-align:center;')}${td(pill(String(r.adjusted), adjustedColor(r.adjusted)), 'text-align:center;')}` +
      `</tr>`;
  });
  b += `</tbody></table>`;
  b += `<div style="font-size:8pt;font-style:italic;color:${MUTE};margin:-3pt 0 4pt;">Anchor cell is tinted green. Coverage under 50% (fewer than 4 of 8 sources) caps a line item at 3. Score uses the worst outlier vs. the anchor, not an average.</div>`;

  const bandMap = { 5: 'Verified consistent', 4: 'Largely consistent', 3: 'Moderate variance', 2: 'High variance', 1: 'Severe variance' };
  b += `<table style="${TBL}"><tr>
      <td style="${TD}text-align:center;"><div style="font-size:6.5pt;color:${MUTE};margin-bottom:1pt;">Final Score</div><b style="font-size:9pt;">${t.final === null ? '—' : t.final}</b><div style="font-size:8pt;color:${MUTE};">out of 5</div></td>
      <td style="${TD}text-align:center;"><div style="font-size:6.5pt;color:${MUTE};margin-bottom:1pt;">Average (before rounding)</div><b style="font-size:9pt;">${t.avg === null ? '—' : t.avg.toFixed(1)}</b></td>
      <td style="${TD}text-align:center;"><div style="font-size:6.5pt;color:${MUTE};margin-bottom:1pt;">Band</div><b>${t.final === null ? 'Awaiting data' : (bandMap[t.final] || '')}</b></td>
      <td style="${TD}text-align:center;"><div style="font-size:6.5pt;color:${MUTE};margin-bottom:1pt;">Scored / Excluded / No comparator</div><b>${t.scoredCount} / ${t.excludedCount} / ${t.naCount}</b></td>
    </tr></table>`;

  // Always rendered on its own A4-landscape page (named "tri"), whether printed standalone
  // or embedded at the end of the RAF sheet (which otherwise runs A4 portrait).
  const pageBreakStyle = opts.pageBreakBefore ? 'page-break-before:always;break-before:page;' : '';
  return `<div style="page:tri;${pageBreakStyle}">${b}</div>`;
}

function buildRafBodyHtml(form, rowValues, triItems, logoDataUrl) {
  const c = raf.compute(rowValues, form);
  const catBreakdown = raf.categoryBreakdown(rowValues);
  const finalMetrics = raf.getFinalMetrics(form, c);
  const prescribedText = raf.formatPHP(c.prescribed);

  let b = '';

  b += headerBlock(logoDataUrl, form, 'RISK ASSESSMENT FRAMEWORK – STANDARD', '*Applicable to limits of up to PHP 50m');

  // ── mandatory target market screening ──
  b += `<table style="${TBL}"><thead>
    <tr><th colspan="4" style="${SECTION_BAR}">MANDATORY TARGET MARKET SCREENING</th></tr>
    <tr>
      <th style="${TH}width:30%;">Criteria</th>
      <th style="${TH}">Mandatory Screen</th>
      <th style="${TH}width:14%;">Actual</th>
      <th style="${TH}width:10%;text-align:center;">Pass / Fail</th>
    </tr>
  </thead><tbody>`;
  raf.MANDATORY_ROWS.forEach((row) => {
    const val = rowValues[row.key] ?? row.actual;
    const pass = raf.mandPass(row, val);
    b += `<tr>${td(esc(row.label))}${td(esc(row.screen), 'color:' + MUTE + ';')}${td(esc(val))}${td(passFailPill(pass), 'text-align:center;')}</tr>`;
  });
  b += `</tbody></table>`;
  b += `<table style="${TBL}margin-top:-6pt;"><tr><td style="border:1px solid #ccd3da;padding:2pt 5pt;font-weight:bold;font-size:7pt;">Final Target Market Assessment: ${c.mandResult === 'FAIL' ? pill('FAIL', RED) : c.mandResult === 'PASS' ? pill('PASS', GREEN) : pill('No data', '#8a97a6')}</td></tr></table>`;

  // ── risk tiering framework ──
  b += `<table style="${TBL}"><thead>
    <tr><th colspan="9" style="${SECTION_BAR}">RISK TIERING FRAMEWORK</th></tr>
    <tr>
      <th style="${TH}width:22%;">Criteria</th>
      <th style="${TH}">Tier 1</th><th style="${TH}">Tier 2</th><th style="${TH}">Tier 3</th><th style="${TH}">Tier 4</th><th style="${TH}">Tier 5</th><th style="${TH}">Tier 6</th>
      <th style="${TH}width:11%;">Actual</th>
      <th style="${TH}width:8%;text-align:center;">Tier</th>
    </tr>
  </thead><tbody>`;
  raf.TIERING_CATS.forEach((cat) => {
    const label = cat.note ? `${esc(cat.cat)} &mdash; <span style="font-weight:normal;font-style:italic;">${esc(cat.note)}</span>` : esc(cat.cat);
    b += `<tr><td colspan="9" style="${CAT_ROW}">${label}</td></tr>`;
    cat.rows.forEach((row) => {
      const val = rowValues[row.key] ?? row.actual;
      const t = raf.rowTier(row, cat.cat, rowValues);
      let bandCells;
      if (row.mergedBand) {
        bandCells = `<td colspan="6" style="${TD}text-align:center;">${esc(row.mergedBand)}</td>`;
      } else {
        bandCells = row.bands.map((band) => td(esc(band))).join('');
      }
      b += `<tr>${td(esc(row.label))}${bandCells}${td(esc(val))}${td(tierPill(t), 'text-align:center;')}</tr>`;
    });
  });
  b += `</tbody></table>`;

  // ── risk tiering framework summary ──
  b += `<table style="${TBL}"><thead>
    <tr><th colspan="12" style="${SECTION_BAR}">RISK TIERING FRAMEWORK SUMMARY</th></tr>
    <tr>
      <th style="${TH}width:22%;">Category</th>
      <th style="${TH}text-align:center;">T1</th><th style="${TH}text-align:center;">T2</th><th style="${TH}text-align:center;">T3</th>
      <th style="${TH}text-align:center;">T4</th><th style="${TH}text-align:center;">T5</th><th style="${TH}text-align:center;">T6</th>
      <th style="${TH}text-align:center;">FAIL</th><th style="${TH}text-align:center;">N/A</th>
      <th style="${TH}text-align:center;">Tier</th><th style="${TH}">Status</th><th style="${TH}text-align:center;">Inputs</th>
    </tr>
  </thead><tbody>`;
  catBreakdown.forEach((row) => {
    b += `<tr>${td(esc(row.cat))}` +
      [1, 2, 3, 4, 5, 6].map((n) => td(String(row.counts[n]), 'text-align:center;')).join('') +
      td(String(row.counts.FAIL), 'text-align:center;') + td(String(row.counts.NA), 'text-align:center;') +
      td(tierPill(row.tierResult), 'text-align:center;') + td(esc(row.status)) + td(String(row.inputs), 'text-align:center;') +
      `</tr>`;
  });
  b += `</tbody></table>`;
  b += `<table style="${TBL}margin-top:-6pt;"><tr><td style="border:1px solid #ccd3da;padding:2pt 5pt;font-weight:bold;font-size:7pt;">Worst Risk Tiering: ${tierPill(c.worstTier)}</td></tr></table>`;

  // ── final risk tier ──
  b += `<div style="${SECTION_BAR}">FINAL RISK TIER</div>`;
  b += `<table style="${TBL}"><tr>
      <td style="${TD}text-align:center;"><div style="font-size:6.5pt;color:${MUTE};margin-bottom:1pt;"># of Exceptions</div><b style="font-size:9pt;">${c.exceptions}</b></td>
      <td style="${TD}text-align:center;"><div style="font-size:6.5pt;color:${MUTE};margin-bottom:1pt;">Worst Risk Tier</div>${tierPill(c.worstTier)}</td>
      <td style="${TD}text-align:center;"><div style="font-size:6.5pt;color:${MUTE};margin-bottom:1pt;">Final Risk Tiering</div>${tierPill(c.finalTier)}</td>
    </tr></table>`;
  b += `<div style="font-size:6.5pt;color:${MUTE};margin:-2pt 0 3pt;">&le; 2 exceptions &mdash; CLO Approval Required &nbsp;|&nbsp; More than 2 exceptions &mdash; CEO and CLO Approval Required</div>`;
  b += `<div style="font-size:8pt;font-weight:bold;color:${RED};margin:0 0 4pt;">Approval Required: ${esc(c.approvalText)}</div>`;

  // ── risk appetite framework ──
  if (c.appetite) {
    b += `<table style="${TBL}"><thead>
      <tr><th colspan="7" style="${SECTION_BAR}">RISK APPETITE FRAMEWORK</th></tr>
      <tr>
        <th style="${TH}">Max. Notional Amount</th><th style="${TH}">Final Risk Tiering</th><th style="${TH}">% of Obligor Revenues</th>
        <th style="${TH}">% Share of Total Wallet</th><th style="${TH}">Min. ADB x of EMI</th><th style="${TH}">Min. Pricing</th><th style="${TH}">Max. Tenor</th>
      </tr>
    </thead><tbody>`;
    raf.APPETITE.forEach((a) => {
      const active = c.finalNum && a.tier === `Tier ${c.finalNum}`;
      const rowStyle = active ? `background-color:#eaf6ea;font-weight:bold;` : '';
      b += `<tr style="${rowStyle}">${td(raf.formatPHP(a.notionalNum) + (active ? ' &#9733;' : ''))}${td(a.tier)}${td(a.rev)}${td(a.wallet)}${td(a.adb)}${td(a.price)}${td(a.tenor)}</tr>`;
    });
    b += `</tbody></table>`;
    b += `<div style="font-size:8pt;font-style:italic;color:${MUTE};margin:-3pt 0 4pt;">With 1st charge collateral, the above amounts may be doubled.</div>`;

    b += `<table style="${TBL}"><thead><tr><th style="${TH}width:40%;">Factor</th><th style="${TH}">Implied Limit</th></tr></thead><tbody>`;
    c.limit.rows.forEach((r) => {
      b += `<tr>${td(esc(r.label))}${td(r.available ? raf.formatPHP(r.value) : '&mdash;')}</tr>`;
    });
    b += `</tbody></table>`;
    b += `<div style="font-size:8pt;font-style:italic;color:${MUTE};margin:-3pt 0 4pt;">The prescribed maximum limit must satisfy all risk appetite thresholds (i.e. the minimum implied limit across factors).</div>`;

    b += `<table style="${TBL}"><thead><tr><th style="${TH}width:22%;">Factor</th><th style="${TH}width:22%;">Prescribed Terms</th><th style="${TH}">Explanation</th></tr></thead><tbody>`;
    b += `<tr>${td('<b>Maximum Limit</b>')}${td(prescribedText)}${td('Determined by limit satisfying all risk appetite thresholds', 'color:' + MUTE + ';')}</tr>`;
    b += `<tr>${td('<b>Minimum Pricing</b>')}${td(`${c.appetite.tier} &ndash; ${c.appetite.price}`)}${td('Determined by Final Risk Tier', 'color:' + MUTE + ';')}</tr>`;
    b += `<tr>${td('<b>Maximum Tenor</b>')}${td(`${c.appetite.tier} &ndash; ${c.appetite.tenor}`)}${td('Determined by Final Risk Tier', 'color:' + MUTE + ';')}</tr>`;
    b += `</tbody></table>`;

    if (finalMetrics.some((m) => m.value !== null)) {
      b += `<table style="${TBL}"><thead><tr><th style="${TH}width:30%;">Final Risk Tiering &ndash; Metric</th><th style="${TH}">Value</th><th style="${TH}">Status</th></tr></thead><tbody>`;
      finalMetrics.forEach((m) => {
        const statusPill = m.status === null ? '&mdash;' : pill(m.status, m.status === 'Within Threshold' ? GREEN : RED);
        b += `<tr>${td('<b>' + esc(m.label) + '</b>')}${td(m.value ?? '&mdash;')}${td(statusPill)}</tr>`;
      });
      b += `</tbody></table>`;
    }
  }

  // ── sign-off (kept on the RAF sheet, before the triangulator's own page) ──
  function sigBlock(label, name, title) {
    return `<td style="border:none;border-top:1px solid #ccd3da;padding:4pt 8pt 0;width:33%;text-align:center;vertical-align:top;">
      <div style="font-weight:bold;font-size:7pt;color:${NAVY};margin-bottom:14pt;">${esc(label)}</div>
      <div style="border-top:1pt solid ${INK};padding-top:3pt;">
        <div style="font-weight:bold;font-size:8pt;">${esc(name || ' ')}</div>
        <div style="font-size:6.5pt;color:${MUTE};text-transform:uppercase;">${esc(title || '')}</div>
      </div>
    </td>`;
  }
  b += `<table style="${TBL}margin-top:6pt;"><tr>
      ${sigBlock('PREPARED BY', form.preparedBy, form.position || 'Chief Lending Officer')}
      ${sigBlock('REVIEWED BY (CLO)', 'Dwaipayan Mitra', 'Chief Lending Officer')}
      ${sigBlock('APPROVED BY (CEO)', form.scoBy || 'Adnan Agha', 'Chief Executive Officer')}
    </tr></table>`;

  // ── financial data triangulator (own page, after the RAF sheet and its sign-off) ──
  if (triItems && triItems.length) {
    b += buildTriBodyHtml(form, triItems, null, { includeHeader: false, pageBreakBefore: true });
  }

  return b;
}

// Renders a body-HTML fragment into a hidden iframe (landscape) and opens the browser
// print dialog, so "Print / Save PDF" produces the template layout instead of whatever
// on-screen dashboard is currently showing.
function printHtml(bodyHtml, docTitle) {
  const html = `<html><head><meta charset='utf-8'><title>${esc(docTitle)}</title><style>
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}
    body{font-family:Calibri,Arial,sans-serif;font-size:7pt;color:${INK};margin:0;}
    @page{size:A4;margin:9mm;}
    @page tri{size:A4 landscape;margin:9mm;}
    table{page-break-inside:auto;}
    tr{page-break-inside:avoid;}
  </style></head><body>${bodyHtml}</body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  setTimeout(() => document.body.removeChild(iframe), 1000);
}

export async function printRafReport({ form, rowValues, triItems }) {
  const logoDataUrl = await getLogoDataUrl();
  const b = buildRafBodyHtml(form, rowValues, triItems, logoDataUrl);
  printHtml(b, `RAF - ${form.obligorName || 'Assessment'}`);
}

// Prints just the Financial Data Triangulator sheet, standalone, from the Triangulator page.
export async function printTriReport({ form, triItems }) {
  const logoDataUrl = await getLogoDataUrl();
  const b = buildTriBodyHtml(form, triItems, logoDataUrl, { includeHeader: true });
  printHtml(b, `Data Triangulator - ${form.obligorName || 'Assessment'}`);
}
