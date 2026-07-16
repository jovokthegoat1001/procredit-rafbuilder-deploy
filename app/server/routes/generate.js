import { Router } from 'express';
import multer from 'multer';
import { DOC_TYPES, MODEL_FALLBACKS, buildDocPrompt } from '../lib/prompt.js';
import { xlsxToText } from '../lib/xlsxToText.js';
import { mapExtraction } from '../lib/mapExtraction.js';
import { computeTiering } from '../lib/tiering.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const router = Router();

function isModelError(message) {
  return /model|not_found|not available|does not exist|invalid_request/i.test(message || '');
}

function candidateModels() {
  const preferred = process.env.ANTHROPIC_MODEL;
  return Array.from(new Set([preferred].concat(MODEL_FALLBACKS).filter(Boolean)));
}

async function fileToContentBlocks(doc, file) {
  const name = file.originalname.toLowerCase();
  const label = `Source document: ${doc.title} - ${file.originalname}`;
  if (name.endsWith('.pdf')) {
    return [
      { type: 'text', text: label },
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.buffer.toString('base64') } },
    ];
  }
  let body;
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) body = xlsxToText(file.buffer);
  else body = file.buffer.toString('utf8');
  return [{ type: 'text', text: `${label}\n\n${body.slice(0, 65000)}` }];
}

// One extraction call for a single document type (with model fallback). Resolves to
// { ok, envelope, model } or { ok:false, error }.
async function extractDoc(apiKey, doc, files) {
  const content = [{ type: 'text', text: buildDocPrompt(doc.type) }];
  try {
    for (const file of files) content.push(...(await fileToContentBlocks(doc, file)));
  } catch (err) {
    return { ok: false, error: `could not read uploaded file (${err.message})` };
  }

  const tried = [];
  let lastError = null;
  for (const model of candidateModels()) {
    tried.push(model);
    let resp;
    try {
      resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: 16000, thinking: { type: 'disabled' }, messages: [{ role: 'user', content }] }),
      });
    } catch (err) { lastError = err.message; continue; }

    let data;
    try { data = await resp.json(); } catch (err) { lastError = `Invalid response (${resp.status}): ${err.message}`; continue; }

    if (resp.ok && !data.error) {
      const text = (data.content || []).filter((p) => p.type === 'text').map((p) => p.text || '').join('');
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      try {
        if (start === -1 || end === -1 || end < start) throw new Error('no JSON object found in response');
        return { ok: true, envelope: JSON.parse(text.slice(start, end + 1)), model };
      } catch (err) { lastError = `${model} returned unparseable JSON (stop_reason: ${data.stop_reason}): ${err.message}`; continue; }
    }
    lastError = data.error?.message || `${resp.status} ${resp.statusText}`;
    if (!isModelError(lastError)) break;
  }
  return { ok: false, error: `${lastError} (tried: ${tried.join(', ')})` };
}

router.post('/', upload.fields(DOC_TYPES.map((d) => ({ name: d.type, maxCount: d.multiple ? 10 : 1 }))), async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: 'Server is missing ANTHROPIC_API_KEY. Add it to server/.env.' });

  const present = DOC_TYPES.filter((doc) => req.files?.[doc.type]?.length);
  if (!present.length) {
    return res.status(400).json({ ok: false, error: 'No documents were uploaded. Attach at least one of GIS / LTR / FS / CBR.' });
  }

  try {
    // Extract every uploaded document in parallel, each with its own focused schema.
    const results = await Promise.all(present.map((doc) => extractDoc(apiKey, doc, req.files[doc.type])));

    const envelopes = {};
    const docErrors = [];
    const modelsUsed = new Set();
    present.forEach((doc, i) => {
      const r = results[i];
      if (r.ok) { envelopes[doc.type] = r.envelope; modelsUsed.add(r.model); }
      else docErrors.push(`${doc.type.toUpperCase()}: ${r.error}`);
    });

    if (!Object.keys(envelopes).length) {
      return res.status(502).json({ ok: false, error: `Extraction failed for every document.\n${docErrors.join('\n')}` });
    }

    // Reduce the rich envelopes to the flat raw-value object, then resolve every
    // document-sourced tier deterministically.
    const { data, warnings } = mapExtraction(envelopes);
    computeTiering(data);
    docErrors.forEach((e) => warnings.push(`[EXTRACTION] ${e}`));

    res.json({
      ok: true,
      data,
      extractions: envelopes,
      warnings,
      models: Array.from(modelsUsed),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: `Failed to process the extracted data: ${err.message}` });
  }
});

export default router;
