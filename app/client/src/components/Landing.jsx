export default function Landing({ onEnter, onSample }) {
  return (
    <div className="lp-scroll">
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(246,248,251,.85)', backdropFilter: 'saturate(140%) blur(10px)', borderBottom: '1px solid #e6ebf1' }}>
        <div className="lp-pad" style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 18 }}>
          <a onClick={onEnter} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <img src="/procredit-logo.png" alt="ProCredit Financing Corp" style={{ height: 34, width: 'auto', display: 'block' }} />
          </a>
          <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 26, marginLeft: 24 }}>
            <a href="#product" className="navlink" style={{ fontWeight: 500, fontSize: 13.5, color: '#3d5063' }}>Product</a>
            <a href="#how" className="navlink" style={{ fontWeight: 500, fontSize: 13.5, color: '#3d5063' }}>How it works</a>
            <a href="#documents" className="navlink" style={{ fontWeight: 500, fontSize: 13.5, color: '#3d5063' }}>Documents</a>
          </div>
          <div style={{ flex: 1 }} />
          <a onClick={onEnter} className="navlink" style={{ fontWeight: 600, fontSize: 13.5, color: '#1f5a83', cursor: 'pointer' }}>Sign in</a>
          <a onClick={onEnter} className="btn" style={{ fontWeight: 700, fontSize: 13.5, padding: '11px 20px', borderRadius: 11, background: '#4ea246', color: '#fff', cursor: 'pointer' }}>Open RAF Builder</a>
        </div>
      </header>

      <section className="lp-pad" style={{ background: 'linear-gradient(135deg,#0c2f47 0%,#10463f 70%,#155a38 100%)', color: '#fff', position: 'relative', overflow: 'hidden', padding: '0 28px' }}>
        <div style={{ position: 'absolute', top: -60, right: '6vw', width: 'clamp(80px,8vw,150px)', height: 'clamp(380px,62vh,720px)', borderRadius: '0 0 70px 70px', background: 'linear-gradient(180deg,#2a75a8,#4ea246)', opacity: .32, transform: 'rotate(18deg)', pointerEvents: 'none', animation: 'ribbonIn 1s ease-out both' }} />
        <div style={{ position: 'absolute', top: -40, right: 'calc(6vw + clamp(96px,9vw,150px))', width: 'clamp(50px,5vw,96px)', height: 'clamp(320px,54vh,640px)', borderRadius: '0 0 50px 50px', background: 'linear-gradient(180deg,#6cb6e0,#8fd687)', opacity: .26, transform: 'rotate(14deg)', pointerEvents: 'none', animation: 'ribbonIn 1.2s ease-out both' }} />
        <div className="lp-hero-grid" style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 40, alignItems: 'center', padding: '88px 0 96px', position: 'relative' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontWeight: 500, fontSize: 12.5, color: '#fff', padding: '8px 15px', borderRadius: 999, background: 'rgba(255,255,255,.12)', marginBottom: 26 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: '#8fd687' }} />Credit Risk · ProCredit Financing Corp
            </div>
            <h1 className="lp-h1" style={{ fontWeight: 800, fontSize: 62, letterSpacing: '-.03em', lineHeight: 1.03, margin: '0 0 20px' }}>Four documents in.<br />One <span style={{ color: '#8fd687' }}>RAF</span> out.</h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,.78)', maxWidth: 520, margin: '0 0 34px' }}>The RAF Builder reads the borrower's CBR, bank statements, GIS and KYF, then scores the risk matrix and drafts the committee-ready recommendation your team signs off on.</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a onClick={onEnter} className="btn" style={{ fontWeight: 700, fontSize: 15, padding: '17px 30px', borderRadius: 13, background: '#4ea246', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>Start an assessment →</a>
              <a onClick={onSample} className="btn" style={{ fontWeight: 700, fontSize: 15, padding: '17px 30px', borderRadius: 13, background: 'rgba(255,255,255,.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,.35)', display: 'inline-flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>View sample report</a>
            </div>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginTop: 44 }}>
              <div><div style={{ fontWeight: 800, fontSize: 30, letterSpacing: '-.02em' }}>4</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>source documents merged</div></div>
              <div><div style={{ fontWeight: 800, fontSize: 30, letterSpacing: '-.02em' }}>5</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>risk dimensions scored</div></div>
              <div><div style={{ fontWeight: 800, fontSize: 30, letterSpacing: '-.02em' }}>1</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>committee-ready output</div></div>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(0,0,0,.28)', padding: 22, color: '#0f1f33', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Project Duo Events &amp; Marketing Corp.</div>
              <span style={{ fontWeight: 700, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase', color: '#b06f1a', background: '#fbf0df', padding: '4px 9px', borderRadius: 999 }}>Moderate-High</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ border: '1px solid #eef2f6', borderRadius: 12, padding: 13 }}><div style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6b7a8d' }}>Composite risk</div><div style={{ fontWeight: 800, fontSize: 22, color: '#b06f1a', letterSpacing: '-.02em' }}>3.2/5</div></div>
              <div style={{ border: '1px solid #eef2f6', borderRadius: 12, padding: 13 }}><div style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6b7a8d' }}>DSCR</div><div style={{ fontWeight: 800, fontSize: 22, color: '#3d8a36', letterSpacing: '-.02em' }}>1.82x</div></div>
              <div style={{ border: '1px solid #eef2f6', borderRadius: 12, padding: 13 }}><div style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6b7a8d' }}>Exposure</div><div style={{ fontWeight: 800, fontSize: 22, color: '#1f5a83', letterSpacing: '-.02em' }}>₱61.2M</div></div>
              <div style={{ border: '1px solid #eef2f6', borderRadius: 12, padding: 13 }}><div style={{ fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: '#6b7a8d' }}>Adverse media</div><div style={{ fontWeight: 800, fontSize: 22, color: '#c0392b', letterSpacing: '-.02em' }}>1 · Verify</div></div>
            </div>
            <div style={{ background: '#0c2f47', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>Recommendation</div>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#fff', background: '#4ea246', padding: '7px 12px', borderRadius: 8 }}>Approve with conditions</div>
            </div>
          </div>
        </div>
      </section>

      <section id="documents" className="lp-pad" style={{ maxWidth: 1180, margin: '0 auto', padding: '84px 28px 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 44px' }}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: '#2a75a8', marginBottom: 12 }}>The four sources</div>
          <h2 style={{ fontWeight: 800, fontSize: 36, letterSpacing: '-.025em', margin: '0 0 12px' }}>Everything the committee needs, from documents you already have.</h2>
          <p style={{ fontSize: 16, color: '#6b7a8d', margin: 0 }}>Each source maps to a section of the assessment. Drop them in any order.</p>
        </div>
        <div className="lp-grid4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
          {[
            { tag: 'CBR', fg: '#2a75a8', bg: '#e8f1f8', title: 'Credit standing', desc: "Risk rating, delinquency history & total exposure from the Credit Bureau Report." },
            { tag: 'BANK / LTR', fg: '#3d8a36', bg: '#ebf5e9', title: 'Cash flow', desc: 'Inflows, average daily balance & deposit consistency over six months.' },
            { tag: 'GIS', fg: '#2a75a8', bg: '#e8f1f8', title: 'Corporate profile', desc: 'SEC registration, paid-up capital, shareholders & officers.' },
            { tag: 'KYF', fg: '#3d8a36', bg: '#ebf5e9', title: 'Financials', desc: 'Audited FS — revenue, net worth, assets, liabilities & key ratios.' },
          ].map((d) => (
            <div key={d.tag} style={{ background: '#fff', border: '1px solid #e6ebf1', borderRadius: 18, boxShadow: '0 6px 22px rgba(15,31,51,.05)', padding: 26 }}>
              <div style={{ fontWeight: 700, fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: d.fg, background: d.bg, display: 'inline-block', padding: '5px 11px', borderRadius: 8, marginBottom: 16 }}>{d.tag}</div>
              <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 19, letterSpacing: '-.01em' }}>{d.title}</h3>
              <p style={{ margin: 0, fontSize: 13.5, color: '#6b7a8d' }}>{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="lp-pad" style={{ maxWidth: 1180, margin: '0 auto', padding: '84px 28px' }}>
        <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 44px' }}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: '#2a75a8', marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontWeight: 800, fontSize: 36, letterSpacing: '-.025em', margin: 0 }}>From documents to recommendation in three steps.</h2>
        </div>
        <div className="lp-grid3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
          {[
            { n: '01', title: 'Drop the documents', desc: 'Attach the CBR, bank statements, GIS and KYF. The builder reads each one automatically.' },
            { n: '02', title: 'Auto-score the matrix', desc: 'Cash flow, financials, governance and integrity are weighted into a single composite risk score.' },
            { n: '03', title: 'Review & sign off', desc: 'Read the recommendation and conditions, then export to PDF or Word for the committee.' },
          ].map((s) => (
            <div key={s.n} style={{ background: '#fff', border: '1px solid #e6ebf1', borderRadius: 18, boxShadow: '0 6px 22px rgba(15,31,51,.05)', padding: 28, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#2a75a8,#4ea246)' }} />
              <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', background: '#0c2f47', width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', marginBottom: 16 }}>{s.n}</div>
              <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 19, letterSpacing: '-.01em' }}>{s.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: '#6b7a8d' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="lp-pad" style={{ maxWidth: 1180, margin: '0 auto 84px', padding: '0 28px' }}>
        <div style={{ background: 'linear-gradient(135deg,#0c2f47,#10463f)', borderRadius: 24, padding: 56, color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: -80, right: '8%', width: 'clamp(60px,6vw,110px)', height: 'clamp(260px,40vh,460px)', borderRadius: '60px 60px 0 0', background: 'linear-gradient(180deg,#8fd687,#2a75a8)', opacity: .22, transform: 'rotate(20deg)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 560, position: 'relative' }}>
            <h2 style={{ fontWeight: 800, fontSize: 34, letterSpacing: '-.025em', margin: '0 0 14px' }}>Built for the credit committee, not the spreadsheet.</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.78)', margin: '0 0 28px' }}>Consistent scoring, full provenance back to every source, and a clean export your reviewers can sign — every assessment, the same way.</p>
            <a onClick={onEnter} className="btn" style={{ fontWeight: 700, fontSize: 15, padding: '16px 28px', borderRadius: 13, background: '#4ea246', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>Open the RAF Builder →</a>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #e6ebf1', background: '#fff' }}>
        <div className="lp-pad" style={{ maxWidth: 1180, margin: '0 auto', padding: '30px 28px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <img src="/procredit-logo.png" alt="ProCredit Financing Corp" style={{ height: 28, width: 'auto', display: 'block' }} />
          <span style={{ color: '#6b7a8d', fontSize: 12.5, paddingLeft: 14, borderLeft: '1px solid #e6ebf1' }}>Risk Assessment Framework Builder · Internal use only — Credit Risk</span>
          <div style={{ flex: 1 }} />
          <span style={{ color: '#9aa7b4', fontSize: 12 }}>© ProCredit Financing Corp · v0.2</span>
        </div>
      </footer>
    </div>
  );
}
