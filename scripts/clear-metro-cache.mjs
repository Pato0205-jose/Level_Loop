/**
 * Borra la caché de Metro/Expo en %TEMP% (fix "Unable to deserialize cloned data").
 * Uso: npm run clear:cache
 */
import { readdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const prefixes = ['metro-file-map', 'haste-map'];
let removed = 0;

for (const name of readdirSync(tmpdir())) {
  if (!prefixes.some((p) => name.startsWith(p))) continue;
  try {
    unlinkSync(join(tmpdir(), name));
    removed++;
    console.log(`Eliminado: ${name}`);
  } catch {
    console.warn(`No se pudo eliminar: ${name}`);
  }
}

console.log(
  removed > 0
    ? `Listo (${removed} archivo(s)). Arranca Metro con: npm run clear`
    : 'No había caché de Metro en TEMP. Usa: npm run clear',
);
