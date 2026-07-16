export default function ApprovalSignoff({ form, finalBadge, prescribedText, approvalText }) {
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto 24px' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', margin: 0 }}>Approval &amp; Sign-off</h1>
        <div style={{ fontSize: 12, color: '#6b7a8d', marginTop: 2 }}>Credit Committee Review.</div>
      </div>
      <div className="raf-card" style={{ background: '#fff', border: '1px solid #e6ebf1', borderRadius: 14, boxShadow: '0 6px 22px rgba(15,31,51,.05)', overflow: 'hidden' }}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #eef2f6', fontWeight: 700, fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase' }}>Final Decision</div>
        <div style={{ padding: 20 }}>
          <div className="m-grid4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            <div style={{ background: '#f6f8fb', border: '1px solid #eef2f6', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 6 }}>Obligor</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{form.obligorName}</div>
            </div>
            <div style={{ background: '#f6f8fb', border: '1px solid #eef2f6', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 6 }}>Final Tier</div>
              <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 999, background: finalBadge.bg, color: finalBadge.fg }}>{finalBadge.text}</span>
            </div>
            <div style={{ background: '#f6f8fb', border: '1px solid #eef2f6', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 6 }}>Max Limit</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#3d8a36' }}>{prescribedText}</div>
            </div>
            <div style={{ background: '#f6f8fb', border: '1px solid #eef2f6', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d', marginBottom: 6 }}>Approval Level</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c0392b' }}>{approvalText}</div>
            </div>
          </div>
          <div style={{ height: 1, background: '#eef2f6', margin: '22px 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32 }}>
            <div><div style={{ borderBottom: '1.5px solid #0f1f33', height: 34, marginBottom: 5 }} /><div style={{ fontSize: 12, fontWeight: 700 }}>{form.preparedBy}</div><div style={{ fontSize: 11, color: '#6b7a8d' }}>{form.position}</div></div>
            <div><div style={{ borderBottom: '1.5px solid #0f1f33', height: 34, marginBottom: 5 }} /><div style={{ fontSize: 12, fontWeight: 700 }}>Dwaipayan Mitra</div><div style={{ fontSize: 11, color: '#6b7a8d' }}>Chief Lending Officer</div></div>
            <div><div style={{ borderBottom: '1.5px solid #0f1f33', height: 34, marginBottom: 5 }} /><div style={{ fontSize: 12, fontWeight: 700 }}>Adnan Agha</div><div style={{ fontSize: 11, color: '#6b7a8d' }}>Chief Executive Officer</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
