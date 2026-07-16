const th = { textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: '#fff', background: '#0c2f47', padding: '9px 12px' };
const cellInput = { width: '100%', padding: '6px 7px', border: '1.5px solid #e6ebf1', borderRadius: 7, font: 'inherit', fontSize: 12, outline: 'none', background: '#fff' };
const badge = (b) => ({ display: 'inline-block', fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: b.bg, color: b.fg });

const bandRows = [
  { n: '5', bg: '#ebf5e9', fg: '#3d8a36', text: '≤ 20% — verified consistent across sources' },
  { n: '4', bg: '#eaf4e6', fg: '#4e8a2f', text: '> 20% – 40%' },
  { n: '3', bg: '#fbf0df', fg: '#b06f1a', text: '> 40% – 70%' },
  { n: '2', bg: '#fdecdf', fg: '#b5591a', text: '> 70% – 100%' },
  { n: '1', bg: '#fbe8e4', fg: '#c0392b', text: '> 100%' },
];

export default function DataTriangulator({ form, triSources, triRows, triFinalText, triAvgText, triFinalBadge, triBandText, triScoredText, triAnchorHint, onAddTri, onResetTri, onExport }) {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', margin: 0 }}>Financial Data Triangulator</h1>
          <div style={{ fontSize: 12, color: '#6b7a8d', marginTop: 2 }}>Every source compared to a chosen anchor per line item — coverage-adjusted, worst-outlier scoring. Values in Peso '000.</div>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 700, padding: '5px 16px', borderRadius: 999, background: triFinalBadge.bg, color: triFinalBadge.fg }}>Final {triFinalText} · {triBandText}</span>
        <button className="btn" onClick={onExport} style={{ font: "700 12.5px/1 'Poppins',sans-serif", padding: '11px 17px', borderRadius: 10, border: 'none', background: '#4ea246', color: '#fff' }}>Export as Sheet</button>
      </div>

      <div className="raf-card" style={{ background: '#fff', border: '1px solid #e6ebf1', borderRadius: 14, boxShadow: '0 6px 22px rgba(15,31,51,.05)', padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          <div><div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 4 }}>Borrower</div><div style={{ fontSize: 14, fontWeight: 700 }}>{form.obligorName}</div></div>
          <div><div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 4 }}>Assessment date</div><div style={{ fontSize: 14, fontWeight: 700 }}>{form.date}</div></div>
          <div><div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 4 }}>Prepared by</div><div style={{ fontSize: 14, fontWeight: 700 }}>{form.preparedBy}</div></div>
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #eef2f6', fontSize: 12, color: '#6b7a8d', lineHeight: 1.5 }}><strong style={{ color: '#3d5063' }}>Anchor reliability</strong> — {triAnchorHint}</div>
      </div>

      <div className="raf-card" style={{ background: '#fff', border: '1px solid #e6ebf1', borderRadius: 14, boxShadow: '0 6px 22px rgba(15,31,51,.05)', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef2f6', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase' }}>Source Inputs &amp; Triangulation</div>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onResetTri} style={{ font: "700 12px/1 'Poppins',sans-serif", padding: '9px 15px', borderRadius: 9, border: '1.5px solid #d4dde6', background: '#fff', color: '#1f5a83' }}>Reset to sample</button>
          <button className="btn" onClick={onAddTri} style={{ font: "700 12px/1 'Poppins',sans-serif", padding: '9px 15px', borderRadius: 9, border: 'none', background: '#2a75a8', color: '#fff' }}>+ Add line item</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 1720 }}>
            <thead>
              <tr>
                <th colSpan={2} style={{ background: '#103c52', padding: '7px 12px' }} />
                <th colSpan={8} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.72)', background: '#103c52', padding: '7px 12px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,.14)' }}>Source values · Peso '000</th>
                <th colSpan={2} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.72)', background: '#103c52', padding: '7px 12px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,.14)' }}>Anchor</th>
                <th colSpan={6} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.72)', background: '#103c52', padding: '7px 12px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,.14)' }}>Triangulation result</th>
                <th style={{ background: '#103c52', borderLeft: '1px solid rgba(255,255,255,.14)' }} />
              </tr>
              <tr>
                <th style={{ ...th, width: 150 }}>Line Item</th>
                <th style={{ ...th, textAlign: 'center', width: 70 }}>Appl.</th>
                {triSources.map((s) => <th key={s.key} style={{ ...th, textAlign: 'right', width: 98, whiteSpace: 'nowrap' }}>{s.label}</th>)}
                <th style={{ ...th, width: 150, borderLeft: '2px solid #2a75a8' }}>Anchor Source</th>
                <th style={{ ...th, textAlign: 'right', width: 96 }}>Anchor Value</th>
                <th style={{ ...th, textAlign: 'center', width: 76, borderLeft: '2px solid #2a75a8' }}>Sources</th>
                <th style={{ ...th, textAlign: 'center', width: 78 }}>Coverage</th>
                <th style={{ ...th, textAlign: 'right', width: 92 }}>Max Dev %</th>
                <th style={{ ...th, textAlign: 'center', width: 56 }}>Raw</th>
                <th style={{ ...th, textAlign: 'center', width: 70 }}>Flag</th>
                <th style={{ ...th, textAlign: 'center', width: 82 }}>Adjusted</th>
                <th style={{ background: '#0c2f47', width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {triRows.map((r) => (
                <tr key={r.id} className="rafrow" style={{ borderBottom: '1px solid #eef2f6', background: r.rowTint }}>
                  <td style={{ padding: '6px 8px' }}><input type="text" value={r.label} onChange={(e) => r.onLabel(e.target.value)} style={{ ...cellInput, fontWeight: 600 }} /></td>
                  <td style={{ padding: '6px 6px' }}>
                    <select value={r.applicable} onChange={(e) => r.onApplicable(e.target.value)} style={cellInput}><option>Yes</option><option>No</option></select>
                  </td>
                  {r.cells.map((cell, i) => (
                    <td key={i} style={{ padding: '6px 5px' }}>
                      <input type="text" inputMode="decimal" value={cell.value} onChange={(e) => cell.onChange(e.target.value)} placeholder="—" style={{ ...cellInput, textAlign: 'right', background: cell.bg }} />
                    </td>
                  ))}
                  <td style={{ padding: '6px 8px', borderLeft: '2px solid #eef2f6' }}>
                    <select value={r.anchor} onChange={(e) => r.onAnchor(e.target.value)} style={cellInput}>
                      {triSources.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 600, color: '#0f1f33', fontVariantNumeric: 'tabular-nums' }}>{r.anchorValText}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', color: '#3d5063', borderLeft: '2px solid #eef2f6', fontVariantNumeric: 'tabular-nums' }}>{r.countText}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', color: '#3d5063', fontVariantNumeric: 'tabular-nums' }}>{r.covText}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', color: '#3d5063', fontVariantNumeric: 'tabular-nums' }}>{r.devText}</td>
                  <td style={{ padding: '9px 8px', textAlign: 'center', fontWeight: 700, color: '#3d5063' }}>{r.rawText}</td>
                  <td style={{ padding: '9px 6px', textAlign: 'center' }}><span style={badge(r.covBadge)}>{r.covBadge.text}</span></td>
                  <td style={{ padding: '9px 6px', textAlign: 'center' }}><span style={{ ...badge(r.adjBadge), fontSize: 11 }}>{r.adjBadge.text}</span></td>
                  <td style={{ padding: '9px 4px', textAlign: 'center' }}>
                    <button onClick={r.onRemove} title="Remove line item" style={{ border: 'none', background: 'transparent', color: '#c0392b', fontSize: 14, fontWeight: 700, padding: '4px 6px', lineHeight: 1 }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '11px 20px', borderTop: '1px solid #eef2f6', fontSize: 11.5, color: '#6b7a8d' }}>Anchor cell is tinted green. Leave a source blank or type <span style={{ fontFamily: 'monospace' }}>NA</span> when it has no figure for that line.</div>
      </div>

      <div className="m-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="raf-card" style={{ background: '#fff', border: '1px solid #e6ebf1', borderRadius: 14, boxShadow: '0 6px 22px rgba(15,31,51,.05)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #eef2f6', fontWeight: 700, fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase' }}>Triangulation Score</div>
          <div style={{ padding: '22px 20px', display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em', color: triFinalBadge.fg }}>{triFinalText}</div>
              <div style={{ fontSize: 11, color: '#6b7a8d', marginTop: 4 }}>out of 5</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 999, background: triFinalBadge.bg, color: triFinalBadge.fg }}>{triBandText}</span>
              <div style={{ marginTop: 12, fontSize: 13, color: '#3d5063' }}>Average adjusted score <strong style={{ fontSize: 15 }}>{triAvgText}</strong> <span style={{ color: '#9aa7b4' }}>(before rounding)</span></div>
              <div style={{ marginTop: 5, fontSize: 12, color: '#6b7a8d' }}>{triScoredText}</div>
            </div>
          </div>
        </div>

        <div className="raf-card" style={{ background: '#fff', border: '1px solid #e6ebf1', borderRadius: 14, boxShadow: '0 6px 22px rgba(15,31,51,.05)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #eef2f6', fontWeight: 700, fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase' }}>Score Bands · Max Deviation %</div>
          <div style={{ padding: '14px 20px', display: 'grid', gap: 7 }}>
            {bandRows.map((b) => (
              <div key={b.n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'inline-block', width: 26, textAlign: 'center', fontSize: 12, fontWeight: 700, padding: '2px 0', borderRadius: 6, background: b.bg, color: b.fg }}>{b.n}</span>
                <span style={{ fontSize: 12.5, color: '#3d5063' }}>{b.text}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 20px 16px', borderTop: '1px solid #eef2f6', fontSize: 11.5, color: '#6b7a8d', lineHeight: 1.55 }}>Coverage under 50% (fewer than 4 of 8 sources) caps a line item at <strong>3</strong> — thin corroboration can't read as a verified 5. The score uses the <strong>worst outlier</strong> vs the anchor, not an average, so one bad source is never diluted.</div>
        </div>
      </div>
    </div>
  );
}
