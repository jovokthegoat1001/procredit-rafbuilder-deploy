// Minimal, dependency-free XLSX → plain text extractor.
// Reads just enough of the OOXML structure (zip central directory, shared
// strings, worksheet cells) to hand readable text to the Claude prompt.
// Deliberately not a full spreadsheet parser (see: xlsx npm package's
// unpatched CVEs) — this only ever needs to produce prompt text.
import zlib from 'node:zlib';

function decodeXmlEntities(s) {
  return s.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, (full, e) => {
    if (e === 'amp') return '&';
    if (e === 'lt') return '<';
    if (e === 'gt') return '>';
    if (e === 'quot') return '"';
    if (e === 'apos') return "'";
    if (e[0] === '#') {
      const code = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return full;
  });
}

function unzipEntries(buffer) {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65558); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('XLSX could not be read (no end-of-central-directory record).');
  const cdSize = buffer.readUInt32LE(eocd + 12);
  const cdOff = buffer.readUInt32LE(eocd + 16);
  const entries = {};
  let ptr = cdOff;
  const end = cdOff + cdSize;
  while (ptr < end && buffer.readUInt32LE(ptr) === 0x02014b50) {
    const method = buffer.readUInt16LE(ptr + 10);
    const cSize = buffer.readUInt32LE(ptr + 20);
    const lOff = buffer.readUInt32LE(ptr + 42);
    const nameLen = buffer.readUInt16LE(ptr + 28);
    const extraLen = buffer.readUInt16LE(ptr + 30);
    const commentLen = buffer.readUInt16LE(ptr + 32);
    const name = buffer.toString('utf8', ptr + 46, ptr + 46 + nameLen);
    if (name === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(name)) {
      const lNameLen = buffer.readUInt16LE(lOff + 26);
      const lExtraLen = buffer.readUInt16LE(lOff + 28);
      const dataStart = lOff + 30 + lNameLen + lExtraLen;
      const raw = buffer.subarray(dataStart, dataStart + cSize);
      const bytes = method === 0 ? raw : method === 8 ? zlib.inflateRawSync(raw) : null;
      if (bytes) entries[name] = bytes.toString('utf8');
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function extractShared(xml) {
  const shared = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRe.exec(xml))) {
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let tm; let text = '';
    while ((tm = tRe.exec(m[1]))) text += decodeXmlEntities(tm[1]);
    shared.push(text);
  }
  return shared;
}

function extractRows(xml, shared) {
  const lines = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rm; let count = 0;
  while ((rm = rowRe.exec(xml)) && count < 300) {
    count++;
    const cellRe = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    let cm; const vals = [];
    while ((cm = cellRe.exec(rm[1]))) {
      const tMatch = cm[1].match(/\bt="([^"]*)"/);
      const type = tMatch ? tMatch[1] : null;
      let value = '';
      if (type === 's') {
        const vMatch = cm[2].match(/<v>([\s\S]*?)<\/v>/);
        value = vMatch ? (shared[Number(vMatch[1])] || '') : '';
      } else if (type === 'inlineStr') {
        const tMatch2 = cm[2].match(/<t[^>]*>([\s\S]*?)<\/t>/);
        value = tMatch2 ? decodeXmlEntities(tMatch2[1]) : '';
      } else {
        const vMatch = cm[2].match(/<v>([\s\S]*?)<\/v>/);
        value = vMatch ? vMatch[1] : '';
      }
      if (value) vals.push(value);
    }
    if (vals.length) lines.push(vals.join(' | '));
  }
  return lines;
}

export function xlsxToText(buffer) {
  const entries = unzipEntries(buffer);
  const shared = entries['xl/sharedStrings.xml'] ? extractShared(entries['xl/sharedStrings.xml']) : [];
  const sheetNames = Object.keys(entries).filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort();
  const lines = [];
  sheetNames.forEach((name, i) => {
    lines.push('Sheet ' + (i + 1));
    lines.push(...extractRows(entries[name], shared));
  });
  return lines.join('\n').slice(0, 65000);
}
