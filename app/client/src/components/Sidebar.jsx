export default function Sidebar({ nav, uploadCount, docCount, onGoLanding }) {
  return (
    <aside
      className="no-print raf-side"
      style={{ width: 252, flexShrink: 0, background: 'linear-gradient(180deg,#0c2f47 0%,#103c52 60%,#10463f 100%)', color: '#fff', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', top: -30, right: -50, width: 70, height: 280, borderRadius: '0 0 44px 44px', background: 'linear-gradient(180deg,#2a75a8,#4ea246)', opacity: .28, transform: 'rotate(18deg)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -20, right: 6, width: 42, height: 240, borderRadius: '0 0 28px 28px', background: 'linear-gradient(180deg,#6cb6e0,#8fd687)', opacity: .22, transform: 'rotate(14deg)', pointerEvents: 'none' }} />

      <div className="raf-sidehead" style={{ padding: '22px 22px 18px', position: 'relative' }}>
        <div
          style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', display: 'inline-flex', boxShadow: '0 6px 18px rgba(0,0,0,.18)', cursor: 'pointer' }}
          onClick={onGoLanding}
        >
          <img src="/procredit-logo.png" alt="ProCredit Financing Corp" style={{ height: 30, width: 'auto', display: 'block' }} />
        </div>
        <div style={{ marginTop: 14, fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Risk Assessment Framework</div>
        <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>RAF Builder</div>
      </div>

      <div className="raf-divider" style={{ height: 1, background: 'rgba(255,255,255,.1)', margin: '4px 16px 14px' }} />

      <nav className="raf-nav" style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
        <div className="raf-navlabel" style={{ fontSize: 9.5, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', padding: '4px 10px 8px' }}>Workspace</div>
        {nav.map((n) => (
          <button
            key={n.key}
            className="navbtn"
            onClick={n.onClick}
            style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', font: "600 13.5px/1.2 'Poppins',sans-serif", padding: '11px 12px', borderRadius: 10, border: 'none', background: n.bg, color: n.fg }}
          >
            <span style={{ width: 9, height: 9, borderRadius: 3, flexShrink: 0, background: n.dot }} />
            {n.label}
            {n.showBadge && (
              <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 7px', borderRadius: 10, whiteSpace: 'nowrap', background: n.badgeBg, color: n.badgeFg }}>{n.badgeText}</span>
            )}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <div className="raf-sidefoot" style={{ padding: 16, position: 'relative' }}>
        <div style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>Sources attached</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 26, lineHeight: 1 }}>{uploadCount}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', paddingBottom: 3 }}>of {docCount} documents</div>
          </div>
          <div style={{ marginTop: 10, height: 5, borderRadius: 999, background: 'rgba(255,255,255,.14)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(uploadCount / docCount) * 100}%`, background: 'linear-gradient(90deg,#6cb6e0,#8fd687)', borderRadius: 999 }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
