/**
 * Actualiza EXPO_PUBLIC_API_URL en .env con la IPv4 LAN de esta PC.
 * Uso: npm run sync-ip
 */
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');

function pickLanIp() {
  const nets = networkInterfaces();
  const candidates = [];

  for (const entries of Object.values(nets)) {
    for (const net of entries ?? []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      candidates.push(net.address);
    }
  }

  const preferred =
    candidates.find((ip) => ip.startsWith('192.168.')) ??
    candidates.find((ip) => ip.startsWith('10.')) ??
    candidates[0];

  if (!preferred) {
    throw new Error('No se encontró IPv4 LAN. Conéctate a Wi‑Fi.');
  }
  return preferred;
}

const ip = pickLanIp();
const apiUrl = `http://${ip}:3000`;

if (!existsSync(envPath)) {
  writeFileSync(
    envPath,
    `EXPO_PUBLIC_AUTH_PROVIDER=backend\nEXPO_PUBLIC_API_URL=${apiUrl}\n`,
    'utf8',
  );
  console.log(`Creado .env con EXPO_PUBLIC_API_URL=${apiUrl}`);
  process.exit(0);
}

const raw = readFileSync(envPath, 'utf8');
const line = `EXPO_PUBLIC_API_URL=${apiUrl}`;
const next = raw.includes('EXPO_PUBLIC_API_URL=')
  ? raw.replace(/^EXPO_PUBLIC_API_URL=.*$/m, line)
  : `${raw.trimEnd()}\n${line}\n`;

writeFileSync(envPath, next.endsWith('\n') ? next : `${next}\n`, 'utf8');
console.log(`EXPO_PUBLIC_API_URL actualizado → ${apiUrl}`);
console.log('Recarga la app (Metro: tecla r) o vuelve a ejecutar npx expo run:android');
