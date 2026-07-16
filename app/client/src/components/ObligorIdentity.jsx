import UploadDocuments from './UploadDocuments';

const fieldLabel = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#6b7a8d' };
const fieldInput = { padding: '9px 11px', border: '1.5px solid #e6ebf1', borderRadius: 9, font: 'inherit', outline: 'none', background: '#fff' };

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

export default function ObligorIdentity({ form, onField, docCards, uploadCount, expected, onGenerate, generating, generateError, generateResult }) {
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', margin: 0 }}>Upload Documents</h1>
        <span style={{ fontSize: 12, color: '#6b7a8d' }}>Mid Cap · Limits up to PHP 50M · Standard</span>
      </div>

      <div className="raf-card" style={{ background: '#fff', border: '1px solid #e6ebf1', borderRadius: 16, boxShadow: '0 6px 22px rgba(15,31,51,.05)', overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #eef2f6', fontWeight: 700, fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase' }}>Obligor Information</div>
        <div className="identity-grid" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          <Field label="Economic Group"><input type="text" value={form.econGroup} onChange={(e) => onField('econGroup', e.target.value)} style={fieldInput} /></Field>
          <Field label="Date of Assessment"><input type="date" value={form.date} readOnly disabled style={{ ...fieldInput, background: '#f3f5f8', color: '#6b7a8d', cursor: 'not-allowed' }} /></Field>
          <Field label="Prepared By"><input type="text" value={form.preparedBy} onChange={(e) => onField('preparedBy', e.target.value)} style={fieldInput} /></Field>
          <Field label="Position"><input type="text" placeholder="e.g. Chief Lending Officer" value={form.position} onChange={(e) => onField('position', e.target.value)} style={fieldInput} /></Field>
        </div>
      </div>

      <UploadDocuments docCards={docCards} uploadCount={uploadCount} expected={expected} onGenerate={onGenerate} generating={generating} generateError={generateError} generateResult={generateResult} />
    </div>
  );
}
