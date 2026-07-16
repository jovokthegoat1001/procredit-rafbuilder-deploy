const th = { textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', background: '#0c2f47', padding: '12px 15px' };
const cardHead = { padding: '15px 20px', borderBottom: '1px solid #eef2f6', fontWeight: 700, fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase' };
const card = { background: '#fff', border: '1px solid #e6ebf1', borderRadius: 14, boxShadow: '0 6px 22px rgba(15,31,51,.05)', overflow: 'hidden', marginBottom: 18 };
const fieldLabel = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d' };
const fieldInput = { padding: '9px 11px', border: '1.5px solid #e6ebf1', borderRadius: 9, font: 'inherit', outline: 'none', background: '#fff' };
const cellInput = { width: '100%', padding: '6px 9px', border: '1.5px solid #e6ebf1', borderRadius: 7, font: 'inherit', fontSize: 12, outline: 'none', background: '#fff' };
const badge = (b) => ({ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: b.bg, color: b.fg });
const TIERS = [1, 2, 3, 4, 5, 6];

export default function RafAssessment({ tierFlat, worstBadge, finalBadge, form, onField, summaryCats, approvalText, appetiteRows, hasAppetite, impliedLimits, prescribedText, termPrice, termTenor, finalMetrics }) {
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', margin: 0 }}>RAF Assessment</h1>
          <div style={{ fontSize: 12, color: '#6b7a8d', marginTop: 2 }}>Risk tiering, category summary, appetite, and the score triangulator in one place.</div>
        </div>
        <div style={{ flex: 1 }} />
        <span style={badge(finalBadge)}>{finalBadge.text}</span>
      </div>

      <div className="raf-card" style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 820 }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '36%' }}>Factor</th>
                <th style={{ ...th, width: 210 }}>Actual Value</th>
                <th style={{ ...th, width: 270 }}>Judgement / Override</th>
                <th style={{ ...th, textAlign: 'center', width: 90 }}>Tier</th>
              </tr>
            </thead>
            <tbody>
              {tierFlat.map((r, i) => r.isHeader ? (
                <tr key={`h${i}`} style={{ background: '#eef7ec' }}>
                  <td colSpan={4} style={{ padding: '8px 15px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#3d8a36' }}>{r.cat}</td>
                </tr>
              ) : (
                <tr key={r.key} className="rafrow" style={{ borderBottom: '1px solid #eef2f6' }}>
                  <td style={{ padding: '9px 15px', fontSize: 12.5, lineHeight: 1.4, maxWidth: 340 }}>{r.label}</td>
                  <td style={{ padding: '9px 15px' }}>
                    {r.isSelect ? (
                      <select value={r.value} onChange={(e) => r.onChange(e.target.value)} style={cellInput}>
                        {r.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={r.value} onChange={(e) => r.onChange(e.target.value)} style={cellInput} />
                    )}
                  </td>
                  <td style={{ padding: '9px 15px' }}>
                    {r.isGov ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 118px', gap: 6 }}>
                        <input type="text" placeholder="Judgement note" value={r.note} onChange={(e) => r.onNote(e.target.value)} style={cellInput} />
                        <select value={r.override} onChange={(e) => r.onOverride(e.target.value)} style={cellInput}>
                          <option value="computed">Computed</option>
                          {TIERS.map((t) => <option key={t} value={String(t)}>{`Tier ${t}`}</option>)}
                          <option value="FAIL">FAIL</option><option value="N/A">N/A</option>
                        </select>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11.5, color: '#6b7a8d', background: '#f6f8fb', borderRadius: 6, padding: '5px 9px', display: 'inline-block' }}>Computed</span>
                    )}
                  </td>
                  <td style={{ padding: '9px 15px', textAlign: 'center' }}><span style={badge(r.tier)}>{r.tier.text}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="raf-card" style={card}>
        <div style={cardHead}>Final Risk Tier &amp; SCO Approval</div>
        <div style={{ padding: 20 }}>
          <div className="approval-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={fieldLabel}>Final Risk Tier</label>
              <select value={form.finalOverride} onChange={(e) => onField('finalOverride', e.target.value)} style={fieldInput}>
                <option value="computed">Use computed tier</option>
                {TIERS.map((t) => <option key={t} value={String(t)}>{`Override to Tier ${t}`}</option>)}
                <option value="FAIL">Override to FAIL</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={fieldLabel}>SCO Approved By</label>
              <input type="text" placeholder="Name" value={form.scoBy} onChange={(e) => onField('scoBy', e.target.value)} style={fieldInput} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={fieldLabel}>SCO Approval Date</label>
              <input type="date" value={form.scoDate} onChange={(e) => onField('scoDate', e.target.value)} style={fieldInput} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 14 }}>
            <label style={fieldLabel}>SCO Approval Notes</label>
            <input type="text" placeholder="Reason for final tier override or judgemental adjustment" value={form.scoNotes} onChange={(e) => onField('scoNotes', e.target.value)} style={fieldInput} />
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#6b7a8d' }}>Computed worst tier: <span style={badge(worstBadge)}>{worstBadge.text}</span></div>
        </div>
      </div>

      <div className="raf-card" style={card}>
        <div style={cardHead}>Category Summary</div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
            {summaryCats.map((c) => (
              <div key={c.cat} style={{ background: '#f6f8fb', border: '1px solid #eef2f6', borderRadius: 10, padding: 13 }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 8 }}>{c.cat}</div>
                <span style={badge(c.badge)}>{c.badge.text}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, padding: 16, background: '#f6f8fb', borderRadius: 12 }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 6 }}>Computed Worst Tier</div><span style={badge(worstBadge)}>{worstBadge.text}</span></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 6 }}>Final Risk Tier</div><span style={badge(finalBadge)}>{finalBadge.text}</span></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 6 }}>Approval</div><div style={{ fontSize: 11.5, fontWeight: 700, color: '#c0392b' }}>{approvalText}</div></div>
          </div>
        </div>
      </div>

      <div className="raf-card" style={card}>
        <div style={cardHead}>Risk Appetite Framework</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 720 }}>
            <thead>
              <tr>
                {['Max Notional', 'Risk Tier', '% Revenues', '% Wallet', 'Min ADB×EMI', 'Min Pricing', 'Max Tenor'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7a8d', background: '#f6f8fb', padding: '11px 14px', borderBottom: '1.5px solid #e6ebf1' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appetiteRows.map((a) => (
                <tr key={a.notional} style={{ borderBottom: '1px solid #eef2f6', background: a.rowBg }}>
                  <td style={{ padding: '10px 14px', fontWeight: a.weight, color: a.color }}>{a.notional}{a.star}</td>
                  <td style={{ padding: '10px 14px', color: a.color }}>{a.tier}</td>
                  <td style={{ padding: '10px 14px', color: a.color }}>{a.rev}</td>
                  <td style={{ padding: '10px 14px', color: a.color }}>{a.wallet}</td>
                  <td style={{ padding: '10px 14px', color: a.color }}>{a.adb}</td>
                  <td style={{ padding: '10px 14px', color: a.color }}>{a.price}</td>
                  <td style={{ padding: '10px 14px', color: a.color }}>{a.tenor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="raf-card" style={card}>
        <div style={cardHead}>Score Triangulator · Implied Limit Inputs</div>
        <div style={{ padding: 20 }}>
          <div className="risk-inputs" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={fieldLabel}>Annual Revenue Credits</label>
              <input type="text" placeholder="e.g. PHP 499,000,000" value={form.revCredits} onChange={(e) => onField('revCredits', e.target.value)} style={fieldInput} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={fieldLabel}>Total Borrowing / Wallet</label>
              <input type="text" placeholder="e.g. PHP 120,000,000" value={form.totalDebt} onChange={(e) => onField('totalDebt', e.target.value)} style={fieldInput} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={fieldLabel}>Average Daily Balance</label>
              <input type="text" placeholder="e.g. PHP 15,000,000" value={form.adb} onChange={(e) => onField('adb', e.target.value)} style={fieldInput} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={fieldLabel}>ADB / EMI Factor</label>
              <input type="number" step="0.1" value={form.emiFactor} onChange={(e) => onField('emiFactor', e.target.value)} style={fieldInput} />
            </div>
          </div>
          {hasAppetite ? (
            <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
              {impliedLimits.map((l) => (
                <div key={l.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid #eef2f6', paddingBottom: 8, color: '#6b7a8d' }}>
                  <span>{l.label}</span><strong style={{ color: l.color }}>{l.val}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, background: '#eef7ec', borderRadius: 10, padding: '13px 15px', marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: '#0f1f33' }}>Prescribed Maximum Limit <span style={{ fontWeight: 400, color: '#6b7a8d' }}>(lowest of the four)</span></span>
                <strong style={{ color: '#3d8a36', fontSize: 16 }}>{prescribedText}</strong>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 16, color: '#6b7a8d', fontSize: 13 }}>Complete tiering to compute the prescribed limit.</div>
          )}
        </div>
      </div>

      {hasAppetite && (
        <div className="raf-card" style={card}>
          <div style={cardHead}>Prescribed Terms</div>
          <div className="m-grid3" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            <div style={{ background: '#f6f8fb', border: '1px solid #eef2f6', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 6 }}>Maximum Limit</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#3d8a36' }}>{prescribedText}</div>
              <div style={{ fontSize: 11, color: '#6b7a8d', marginTop: 4 }}>1st charge collateral may double the limit.</div>
            </div>
            <div style={{ background: '#f6f8fb', border: '1px solid #eef2f6', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 6 }}>Minimum Pricing (Monthly)</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1f5a83' }}>{termPrice}</div>
            </div>
            <div style={{ background: '#f6f8fb', border: '1px solid #eef2f6', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 6 }}>Maximum Tenor</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f1f33' }}>{termTenor}</div>
            </div>
          </div>
        </div>
      )}

      {hasAppetite && (
        <div className="raf-card" style={{ ...card, marginBottom: 0 }}>
          <div style={cardHead}>Proposed Terms vs. Risk Appetite</div>
          <div style={{ padding: 20 }}>
            <div className="m-grid3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: finalMetrics && finalMetrics.length ? 18 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={fieldLabel}>Proposed Loan Amount</label>
                <input type="text" placeholder="e.g. PHP 5,000,000" value={form.proposedAmount} onChange={(e) => onField('proposedAmount', e.target.value)} style={fieldInput} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={fieldLabel}>Proposed Pricing (Monthly %)</label>
                <input type="text" placeholder="e.g. 3.00%" value={form.proposedPricing} onChange={(e) => onField('proposedPricing', e.target.value)} style={fieldInput} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={fieldLabel}>Proposed Tenor (months)</label>
                <input type="text" placeholder="e.g. 9" value={form.proposedTenor} onChange={(e) => onField('proposedTenor', e.target.value)} style={fieldInput} />
              </div>
            </div>
            {finalMetrics && finalMetrics.length > 0 && (
              <div style={{ display: 'grid', gap: 8 }}>
                {finalMetrics.map((m) => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, borderBottom: '1px solid #eef2f6', paddingBottom: 8 }}>
                    <span style={{ color: '#6b7a8d' }}>{m.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <strong>{m.value ?? '—'}</strong>
                      {m.status && (
                        <span style={badge(m.status === 'Within Threshold' ? { bg: '#ebf5e9', fg: '#3d8a36' } : { bg: '#fbe8e4', fg: '#c0392b' })}>{m.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
