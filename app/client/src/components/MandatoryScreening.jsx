const th = { textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', background: '#0c2f47', padding: '12px 15px' };
const td = { padding: '9px 15px', fontSize: 12.5, lineHeight: 1.4 };
const selectStyle = { width: '100%', padding: '6px 9px', border: '1.5px solid #e6ebf1', borderRadius: 7, font: 'inherit', fontSize: 12, outline: 'none', background: '#fff' };

export default function MandatoryScreening({ rows, mandBadge }) {
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', margin: 0 }}>Mandatory Target Market Screening</h1>
          <div style={{ fontSize: 12, color: '#6b7a8d', marginTop: 2 }}>All criteria must pass to proceed.</div>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 700, padding: '5px 16px', borderRadius: 999, background: mandBadge.bg, color: mandBadge.fg }}>{mandBadge.text}</span>
      </div>
      <div className="raf-card" style={{ background: '#fff', border: '1px solid #e6ebf1', borderRadius: 14, boxShadow: '0 6px 22px rgba(15,31,51,.05)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '36%' }}>Criteria</th>
                <th style={th}>Mandatory Screen</th>
                <th style={{ ...th, width: 190 }}>Actual Value</th>
                <th style={{ ...th, textAlign: 'center', width: 90 }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="rafrow" style={{ borderBottom: '1px solid #eef2f6' }}>
                  <td style={{ ...td, maxWidth: 340 }}>{r.label}</td>
                  <td style={{ ...td, color: '#6b7a8d', fontSize: 11.5 }}>{r.screen}</td>
                  <td style={{ padding: '9px 15px' }}>
                    {r.isSelect ? (
                      <select value={r.value} onChange={(e) => r.onChange(e.target.value)} style={selectStyle}>
                        {r.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : r.isDate ? (
                      <input type="date" value={r.value} onChange={(e) => r.onChange(e.target.value)} style={selectStyle} />
                    ) : (
                      <input type="text" value={r.value} onChange={(e) => r.onChange(e.target.value)} style={selectStyle} />
                    )}
                  </td>
                  <td style={{ padding: '9px 15px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: r.badge.bg, color: r.badge.fg }}>{r.badge.text}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
