function DocCard({ d }) {
  return (
    <label style={{ background: '#f6f8fb', border: '1.5px dashed #c8d4df', borderRadius: 14, padding: 20, minHeight: 152, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', color: d.tagFg, background: d.tagBg, padding: '4px 10px', borderRadius: 7 }}>{d.tag}</span>
        {d.hasFile && <span style={{ fontWeight: 600, fontSize: 10.5, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 7, background: '#3d8a36', color: '#fff' }}>Ready</span>}
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>{d.title}</div>
      <div style={{ color: '#6b7a8d', fontSize: 12.5, lineHeight: 1.5 }}>
        {d.help}{d.multiple ? ' You can attach more than one file.' : ''}
      </div>
      <input
        type="file"
        multiple={!!d.multiple}
        accept=".pdf,.txt,.csv,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={(e) => { d.onFile(e.target.files); e.target.value = ''; }}
      />
      {d.hasFile && d.multiple ? (
        <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px dashed #dbe3ea', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {d.fileNames.map((name, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#3d5063' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{name}</span>
              <span
                role="button"
                title="Remove"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); d.onRemoveFile(idx); }}
                style={{ color: '#8a97a6', fontWeight: 700, cursor: 'pointer', padding: '0 4px' }}
              >×</span>
            </div>
          ))}
        </div>
      ) : d.hasFile && (
        <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px dashed #dbe3ea', fontSize: 12, color: '#3d5063', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.fileName}</div>
      )}
    </label>
  );
}

export default function UploadDocuments({ docCards, uploadCount, expected, onGenerate, generating, generateError, generateResult }) {
  const isOdd = docCards.length % 2 === 1;
  const gridCards = isOdd ? docCards.slice(0, -1) : docCards;
  const trailingCard = isOdd ? docCards[docCards.length - 1] : null;

  return (
    <div className="raf-card no-print" style={{ background: '#fff', border: '1px solid #e6ebf1', borderRadius: 16, boxShadow: '0 6px 22px rgba(15,31,51,.05)', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase' }}>Source Documents</div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#2a75a8', background: '#e8f1f8', padding: '5px 11px', borderRadius: 999 }}>{uploadCount} / {expected} attached</span>
      </div>
      <p style={{ color: '#6b7a8d', fontSize: 13.5, margin: '0 0 20px', maxWidth: 720 }}>
        Attach the source documents for this obligor — PDFs, CSV/TXT files, or XLSX workbooks.
      </p>
      <div className="m-grid2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
        {gridCards.map((d) => <DocCard key={d.type} d={d} />)}
      </div>
      {trailingCard && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <div className="m-grid2-trailing" style={{ minWidth: 260 }}>
            <DocCard d={trailingCard} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating || uploadCount === 0}
          style={{
            font: 'inherit', fontWeight: 700, fontSize: 13.5, padding: '11px 20px', borderRadius: 10, border: 'none',
            cursor: generating || uploadCount === 0 ? 'not-allowed' : 'pointer',
            background: generating || uploadCount === 0 ? '#c8d4df' : '#1f5a83', color: '#fff',
          }}
        >
          {generating ? 'Generating…' : 'Generate RAF from Documents'}
        </button>
        {uploadCount === 0 && !generating && <span style={{ color: '#6b7a8d', fontSize: 12.5 }}>Attach at least one document first.</span>}
      </div>

      {generateError && (
        <div style={{ marginTop: 14, background: '#fbe8e4', border: '1px solid #f3c3b8', color: '#8a2f1f', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
          {generateError}
        </div>
      )}

      {generateResult && (
        <div style={{ marginTop: 14, background: '#f6f8fb', border: '1px solid #e6ebf1', borderRadius: 10, padding: '12px 14px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            <strong>{generateResult.applied}</strong> field{generateResult.applied === 1 ? '' : 's'} filled from the documents.
            {generateResult.skippedUserInput > 0 && <> <strong>{generateResult.skippedUserInput}</strong> couldn't be found and are left for you to enter.</>}
            {generateResult.skippedFilled > 0 && <> <strong>{generateResult.skippedFilled}</strong> already had a value and weren't overwritten.</>}
          </div>
          {generateResult.flags && (
            <div style={{ color: '#8a2f1f', fontWeight: 600 }}>⚠ {generateResult.flags}</div>
          )}
          {generateResult.summary && <div style={{ color: '#3d5063' }}>{generateResult.summary}</div>}
          {generateResult.warnings && generateResult.warnings.length > 0 && (
            <details style={{ marginTop: 2 }}>
              <summary style={{ cursor: 'pointer', color: '#8a6d1f', fontWeight: 600 }}>
                {generateResult.warnings.length} data-quality flag{generateResult.warnings.length === 1 ? '' : 's'} to review
              </summary>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#5a6b7a', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {generateResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
