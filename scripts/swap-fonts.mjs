import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src');

const replacements = [
  [/Sora_400Regular/g, 'Poppins_400Regular'],
  [/Sora_500Medium/g, 'Poppins_500Medium'],
  [/Sora_600SemiBold/g, 'Poppins_600SemiBold'],
  [/Sora_700Bold/g, 'Poppins_700Bold'],
  [/@expo-google-fonts\/sora/g, '@expo-google-fonts/poppins'],
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(name)) files.push(full);
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const original = fs.readFileSync(file, 'utf8');
  let next = original;
  for (const [re, to] of replacements) next = next.replace(re, to);
  if (next !== original) {
    fs.writeFileSync(file, next);
    console.log('Updated', path.relative(path.join(__dirname, '..'), file));
    changed++;
  }
}
console.log(`Done. ${changed} file(s) changed.`);
