import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const transcriptPath =
  'C:/Users/emily/.cursor/projects/c-Users-emily-Documents-Level-Loop/agent-transcripts/65821f1f-6791-49ad-b889-bcb6a4fe2be0/65821f1f-6791-49ad-b889-bcb6a4fe2be0.jsonl';

const content = fs.readFileSync(transcriptPath, 'utf8');
const marker = 'data:image/png;base64,';
const start = content.indexOf(marker);
if (start === -1) {
  console.error('Base64 logo not found');
  process.exit(1);
}

let i = start + marker.length;
while (i < content.length) {
  const ch = content[i];
  if (!/[A-Za-z0-9+/=]/.test(ch)) break;
  i++;
}

const base64 = content.slice(start + marker.length, i);
const outDir = path.join(__dirname, '../assets/images');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'logo.png');
fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
console.log('Saved', outPath, fs.statSync(outPath).size, 'bytes');
