import { useMemo, useState } from 'react';
import * as raf from './lib/rafEngine';
import { printRafReport, printTriReport } from './lib/exportWord';
import Landing from './components/Landing';
import Sidebar from './components/Sidebar';
import ObligorIdentity from './components/ObligorIdentity';
import MandatoryScreening from './components/MandatoryScreening';
import RafAssessment from './components/RafAssessment';
import DataTriangulator from './components/DataTriangulator';
import ApprovalSignoff from './components/ApprovalSignoff';

const NAV_DEF = [
  ['identity', 'Upload Documents', true, 'upload'],
  ['datatri', 'Data Triangulator', true, 'tri'],
  ['mandatory', 'Mandatory Screening', true, 'mand'],
  ['assessment', 'RAF Assessment', true, 'tier'],
  ['approval', 'Approval & Sign-off', false, null],
];

let triSeqCounter = 0;

export default function App() {
  const [phase, setPhase] = useState('landing');
  const [form, setForm] = useState(raf.defaultForm());
  const [rowValues, setRowValues] = useState(raf.defaultRowValues());
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [triItems, setTriItems] = useState(raf.defaultTriItems());
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [generateResult, setGenerateResult] = useState(null);

  const c = useMemo(() => raf.compute(rowValues, form), [rowValues, form]);
  const t = useMemo(() => raf.computeTri(triItems), [triItems]);

  function go(next) {
    setPhase(next);
    window.scrollTo(0, 0);
  }

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === 'regDate') setRowValues((rv) => ({ ...rv, reg_date: val }));
    if (key === 'legalStatus') setRowValues((rv) => ({ ...rv, legal_status: val }));
    if (key === 'finalOverride') setRowValues((rv) => ({ ...rv, final_tier_override: val }));
  }
  function setRow(key, val) {
    setRowValues((rv) => ({ ...rv, [key]: val }));
  }
  function setTriVal(id, key, val) {
    setTriItems((items) => items.map((it) => (it.id === id ? { ...it, vals: { ...it.vals, [key]: val } } : it)));
  }
  function setTriField(id, field, val) {
    setTriItems((items) => items.map((it) => (it.id === id ? { ...it, [field]: val } : it)));
  }
  function addTriRow() {
    triSeqCounter++;
    setTriItems((items) => items.concat([{ id: 'tri' + triSeqCounter, label: 'New line item', applicable: 'Yes', anchor: 'bank', vals: {} }]));
  }
  function removeTriRow(id) {
    setTriItems((items) => items.filter((it) => it.id !== id));
  }
  function resetTri() {
    setTriItems(raf.defaultTriItems());
  }
  function handleFile(type, fileList) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    const doc = raf.DOC_TYPES.find((d) => d.type === type);
    setUploadedFiles((u) => {
      const existing = doc?.multiple ? (u[type] || []) : [];
      return { ...u, [type]: existing.concat(files) };
    });
  }
  function removeFile(type, index) {
    setUploadedFiles((u) => {
      const next = { ...u };
      const arr = (next[type] || []).slice();
      arr.splice(index, 1);
      if (arr.length) next[type] = arr; else delete next[type];
      return next;
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError('');
    setGenerateResult(null);
    try {
      const fd = new FormData();
      raf.DOC_TYPES.forEach((d) => {
        const files = uploadedFiles[d.type];
        if (!files) return;
        files.forEach((f) => fd.append(d.type, f, f.name));
      });
      const res = await fetch('/api/generate', { method: 'POST', body: fd });
      const payload = await res.json();
      if (!payload.ok) {
        setGenerateError(payload.error || 'Generation failed.');
        return;
      }
      const data = payload.data || {};
      let applied = 0, skippedUserInput = 0, skippedFilled = 0;
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'source_company_flags' || key === 'summary') return;
        if (value === undefined || value === '') return;
        if (value === raf.USER_INPUT_SENTINEL) { skippedUserInput++; return; }
        if (raf.GENERATED_FORM_KEYS.includes(key)) {
          if (form[key] !== '') { skippedFilled++; return; }
          setField(key, value);
          applied++;
        } else {
          if (rowValues[key] !== undefined && rowValues[key] !== '') { skippedFilled++; return; }
          setRow(key, value);
          applied++;
        }
      });
      setGenerateResult({ applied, skippedUserInput, skippedFilled, flags: data.source_company_flags || '', summary: data.summary || '', warnings: payload.warnings || [] });
    } catch (err) {
      setGenerateError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  function doPrint() {
    printRafReport({ form, rowValues, triItems });
  }

  function handlePrintTri() {
    printTriReport({ form, triItems });
  }

  // ── derived view data (mirrors the original renderVals()) ──
  const uploadCount = Object.keys(uploadedFiles).length;

  const nav = NAV_DEF.map(([key, label, showBadge, kind]) => {
    const active = phase === key;
    let badgeText = '', badgeBg = 'rgba(255,255,255,.12)', badgeFg = '#cfe3d4';
    if (kind === 'upload') { badgeText = `${uploadCount}/${raf.DOC_TYPES.length}`; if (uploadCount >= 4) { badgeBg = '#1e5a34'; badgeFg = '#a8e6bf'; } }
    if (kind === 'mand') { badgeText = c.mandResult; if (c.mandFail) { badgeBg = '#5c2020'; badgeFg = '#f3b4b4'; } else if (c.mandResult === 'PASS') { badgeBg = '#1e5a34'; badgeFg = '#a8e6bf'; } }
    if (kind === 'tier') { badgeText = c.finalNum ? `T${c.finalNum}` : (c.finalTier === 'FAIL' ? 'FAIL' : c.finalTier === 'NODATA' ? 'No data' : '--'); if (c.finalTier === 'FAIL') { badgeBg = '#5c2020'; badgeFg = '#f3b4b4'; } else if (c.finalNum) { badgeBg = '#1e5a34'; badgeFg = '#a8e6bf'; } }
    if (kind === 'tri') { badgeText = t.final != null ? `S${t.final}` : '--'; if (t.final != null) { badgeBg = '#1e5a34'; badgeFg = '#a8e6bf'; } }
    return { key, label, showBadge, badgeText, badgeBg, badgeFg, onClick: () => go(key), bg: active ? 'rgba(255,255,255,.14)' : 'transparent', fg: active ? '#fff' : 'rgba(255,255,255,.62)', dot: active ? '#8fd687' : 'rgba(255,255,255,.3)' };
  });

  const mandRows = raf.MANDATORY_ROWS.map((row) => {
    const val = rowValues[row.key] ?? row.actual;
    const isSelect = !!(row.type === 'select' || row.opts);
    const isDate = row.type === 'date';
    const options = isSelect ? (row.opts.includes(val) ? row.opts.slice() : [val].concat(row.opts)) : [];
    return { key: row.key, label: row.label, screen: row.screen, value: val, isSelect, isDate, isText: !isSelect && !isDate, options, onChange: (v) => setRow(row.key, v), badge: raf.mandBadgeFor(row, val) };
  });

  const tierFlat = [];
  raf.TIERING_CATS.forEach((cat) => {
    tierFlat.push({ isHeader: true, cat: cat.cat });
    cat.rows.forEach((row) => {
      const val = rowValues[row.key] ?? row.actual;
      const isSelect = !!row.opts;
      const options = isSelect ? (row.opts.includes(val) ? row.opts.slice() : [val].concat(row.opts)) : [];
      const isGov = cat.cat === 'Corporate Governance';
      tierFlat.push({
        isRow: true, key: row.key, label: row.label, value: val, isSelect, isText: !isSelect, options,
        onChange: (v) => setRow(row.key, v), isGov,
        note: rowValues[row.key + '_note'] || '', onNote: (v) => setRow(row.key + '_note', v),
        override: rowValues[row.key + '_tier_override'] || 'computed', onOverride: (v) => setRow(row.key + '_tier_override', v),
        tier: raf.tbadge(raf.rowTier(row, cat.cat, rowValues)),
      });
    });
  });

  const summaryCats = raf.TIERING_CATS.map((cat) => ({ cat: cat.cat, badge: raf.tbadge(c.catResults[cat.cat]) }));

  const appetiteRows = raf.APPETITE.map((a, i) => {
    const active = c.finalNum && (i + 1) === c.finalNum;
    return { ...a, rowBg: active ? '#eef7ec' : '#fff', weight: active ? '700' : '400', color: active ? '#3d8a36' : '#0f1f33', star: active ? ' ★' : '' };
  });

  const limitColors = ['#1f5a83', '#3d8a36', '#b06f1a', '#b5591a'];
  const impliedLimits = c.appetite ? c.limit.rows.map((r, i) => ({ label: r.label, val: r.available ? raf.formatPHP(r.value) : '--', color: r.available ? limitColors[i % 4] : '#9aa7b4' })) : [];
  const finalMetrics = raf.getFinalMetrics(form, c);

  const tagPalette = [['#2a75a8', '#e8f1f8'], ['#3d8a36', '#ebf5e9']];
  const docCards = raf.DOC_TYPES.map((doc, i) => {
    const files = uploadedFiles[doc.type] || [];
    const pal = tagPalette[i % 2];
    return {
      type: doc.type, tag: doc.tag, tagFg: pal[0], tagBg: pal[1], title: doc.title, help: doc.help,
      multiple: !!doc.multiple,
      hasFile: files.length > 0,
      fileName: files.length === 1 ? files[0].name : files.length > 1 ? `${files.length} files attached` : '',
      fileNames: files.map((f) => f.name),
      onFile: (fl) => handleFile(doc.type, fl),
      onRemoveFile: (idx) => removeFile(doc.type, idx),
    };
  });

  const fmt = (n) => (n === null || n === undefined) ? '—' : Number(n).toLocaleString('en-US');
  const triRows = t.rows.map((r) => {
    const cells = raf.TRI_SOURCES.map((s) => ({
      value: r.item.vals[s.key] != null ? r.item.vals[s.key] : '',
      bg: s.key === r.item.anchor ? '#eef7ec' : '#fff',
      onChange: (v) => setTriVal(r.item.id, s.key, v),
    }));
    return {
      id: r.item.id, label: r.item.label, onLabel: (v) => setTriField(r.item.id, 'label', v),
      applicable: r.item.applicable, onApplicable: (v) => setTriField(r.item.id, 'applicable', v),
      cells, anchor: r.item.anchor, onAnchor: (v) => setTriField(r.item.id, 'anchor', v),
      anchorValText: fmt(r.anchorNum), countText: `${r.count} / ${raf.TRI_SOURCES.length}`, covText: `${Math.round(r.coverage * 100)}%`,
      devText: r.maxDev === null ? 'N/A' : (r.maxDev * 100).toFixed(1) + '%', rawText: r.raw === null ? 'N/A' : String(r.raw),
      covBadge: r.covLow ? { text: 'Low', bg: '#fbf0df', fg: '#b06f1a' } : { text: 'OK', bg: '#ebf5e9', fg: '#3d8a36' },
      adjBadge: raf.triScoreBadge(r.adjusted), rowTint: !r.applicable ? '#f6f8fb' : '#fff', onRemove: () => removeTriRow(r.item.id),
    };
  });
  const triBandMap = { 5: 'Verified consistent', 4: 'Largely consistent', 3: 'Moderate variance', 2: 'High variance', 1: 'Severe variance' };

  const mandBadge = c.mandResult === 'FAIL' ? { text: 'FAIL', bg: '#fbe8e4', fg: '#c0392b' } : c.mandResult === 'PASS' ? { text: 'PASS', bg: '#ebf5e9', fg: '#3d8a36' } : { text: 'No data', bg: '#eef1f5', fg: '#8a97a6' };
  const worstBadge = raf.tbadge(c.worstTier);
  const finalBadge = raf.tbadge(c.finalTier);
  const prescribedText = raf.formatPHP(c.prescribed);
  const triFinalBadge = raf.triScoreBadge(t.final === null ? 'N/A' : t.final);

  if (phase === 'landing') {
    return <Landing onEnter={() => go('identity')} onSample={() => go('assessment')} />;
  }

  const sectionProps = {
    identity: <ObligorIdentity form={form} onField={setField} docCards={docCards} uploadCount={uploadCount} expected={raf.DOC_TYPES.length} onGenerate={handleGenerate} generating={generating} generateError={generateError} generateResult={generateResult} />,
    datatri: <DataTriangulator form={form} triSources={raf.TRI_SOURCES} triRows={triRows} triFinalText={t.final === null ? '—' : String(t.final)} triAvgText={t.avg === null ? '—' : t.avg.toFixed(1)} triFinalBadge={triFinalBadge} triBandText={t.final === null ? 'Awaiting data' : (triBandMap[t.final] || '')} triScoredText={`${t.scoredCount} scored · ${t.excludedCount} excluded · ${t.naCount} no comparator`} triAnchorHint={raf.TRI_ANCHOR_HINT} onAddTri={addTriRow} onResetTri={resetTri} onExport={handlePrintTri} />,
    mandatory: <MandatoryScreening rows={mandRows} mandBadge={mandBadge} />,
    assessment: <RafAssessment tierFlat={tierFlat} worstBadge={worstBadge} finalBadge={finalBadge} form={form} onField={setField} summaryCats={summaryCats} approvalText={c.approvalText} appetiteRows={appetiteRows} hasAppetite={!!c.appetite} impliedLimits={impliedLimits} prescribedText={prescribedText} termPrice={c.appetite ? c.appetite.price : '--'} termTenor={c.appetite ? c.appetite.tenor : '--'} finalMetrics={finalMetrics} />,
    approval: <ApprovalSignoff form={form} finalBadge={finalBadge} prescribedText={prescribedText} approvalText={c.approvalText} />,
  };

  return (
    <div className="raf-shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar nav={nav} uploadCount={uploadCount} docCount={raf.DOC_TYPES.length} onGoLanding={() => go('landing')} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <main className="raf-main" style={{ flex: 1, padding: '26px 30px', position: 'relative', overflowY: 'auto' }}>
          <div className="no-print raf-card" style={{ background: '#fff', border: '1px solid #e6ebf1', borderLeft: '5px solid #2a75a8', borderRadius: 14, boxShadow: '0 6px 22px rgba(15,31,51,.05)', padding: '15px 20px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Standard RAF v9 · 2025</div>
              <div style={{ fontSize: 12, color: '#6b7a8d', marginTop: 1 }}>Triangulate the prescribed limit, then export the assessment.</div>
            </div>
            <div style={{ flex: 1 }} />
            <button className="btn" onClick={doPrint} style={{ font: "700 12.5px/1 'Poppins',sans-serif", padding: '11px 17px', borderRadius: 10, border: 'none', background: '#4ea246', color: '#fff' }}>Print / Save PDF</button>
          </div>

          {sectionProps[phase]}
        </main>
      </div>
    </div>
  );
}
