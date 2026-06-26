import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const BG_COLOR = { r: 0x13, g: 0x11, b: 0x25 };
const BG_SIZE = 512;
const MONO_SIZE = 432;

function writePng(filePath, png) {
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
  const stat = fs.statSync(filePath);
  console.log(`  -> ${path.relative(root, filePath)} (${png.width}x${png.height}, ${stat.size} bytes)`);
}

function generateBackground() {
  const png = new PNG({ width: BG_SIZE, height: BG_SIZE });
  for (let y = 0; y < BG_SIZE; y++) {
    for (let x = 0; x < BG_SIZE; x++) {
      const idx = (BG_SIZE * y + x) << 2;
      png.data[idx] = BG_COLOR.r;
      png.data[idx + 1] = BG_COLOR.g;
      png.data[idx + 2] = BG_COLOR.b;
      png.data[idx + 3] = 0xff;
    }
  }
  writePng(path.join(root, 'assets', 'android-icon-background.png'), png);
}

function resampleBilinear(src, dstW, dstH) {
  const dst = new PNG({ width: dstW, height: dstH });
  const xRatio = (src.width - 1) / Math.max(1, dstW - 1);
  const yRatio = (src.height - 1) / Math.max(1, dstH - 1);
  for (let y = 0; y < dstH; y++) {
    const sy = y * yRatio;
    const y0 = Math.floor(sy);
    const y1 = Math.min(src.height - 1, y0 + 1);
    const wy = sy - y0;
    for (let x = 0; x < dstW; x++) {
      const sx = x * xRatio;
      const x0 = Math.floor(sx);
      const x1 = Math.min(src.width - 1, x0 + 1);
      const wx = sx - x0;
      const i00 = (src.width * y0 + x0) << 2;
      const i01 = (src.width * y0 + x1) << 2;
      const i10 = (src.width * y1 + x0) << 2;
      const i11 = (src.width * y1 + x1) << 2;
      const dstIdx = (dstW * y + x) << 2;
      for (let c = 0; c < 4; c++) {
        const v0 = src.data[i00 + c] * (1 - wx) + src.data[i01 + c] * wx;
        const v1 = src.data[i10 + c] * (1 - wx) + src.data[i11 + c] * wx;
        dst.data[dstIdx + c] = Math.round(v0 * (1 - wy) + v1 * wy);
      }
    }
  }
  return dst;
}

function generateMonochrome() {
  const logoPath = path.join(root, 'assets', 'images', 'logo.png');
  const src = PNG.sync.read(fs.readFileSync(logoPath));
  // Aislar los trazos brillantes del símbolo (neón azul/morado/rosa) y
  // descartar el fondo oscuro con el patrón de circuitos.
  // Heurística: el símbolo del logo es el píxel más saturado y brillante.
  // Para cada píxel calculamos brillo y saturación; si supera los umbrales,
  // lo convertimos en blanco con alpha proporcional al brillo.
  const isolated = new PNG({ width: src.width, height: src.height });
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const idx = (src.width * y + x) << 2;
      const r = src.data[idx];
      const g = src.data[idx + 1];
      const b = src.data[idx + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const brightness = max / 255;
      const saturation = max === 0 ? 0 : (max - min) / max;
      // El símbolo neón tiene saturación >= 0.45 y brillo >= 0.55
      // El fondo del circuito tiene alta saturación pero brillo bajo (~0.15-0.35)
      const isSymbol = saturation >= 0.45 && brightness >= 0.55;
      const alpha = isSymbol ? Math.round(Math.min(1, (brightness - 0.45) / 0.45) * 255) : 0;
      isolated.data[idx] = 255;
      isolated.data[idx + 1] = 255;
      isolated.data[idx + 2] = 255;
      isolated.data[idx + 3] = alpha;
    }
  }
  // Dilatar ligeramente para rellenar huecos internos del trazo neón.
  const dilated = new PNG({ width: src.width, height: src.height });
  const radius = 2;
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      let maxAlpha = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= src.height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= src.width) continue;
          const a = isolated.data[((src.width * yy + xx) << 2) + 3];
          if (a > maxAlpha) maxAlpha = a;
        }
      }
      const idx = (src.width * y + x) << 2;
      dilated.data[idx] = 255;
      dilated.data[idx + 1] = 255;
      dilated.data[idx + 2] = 255;
      dilated.data[idx + 3] = maxAlpha;
    }
  }
  // Encajar el símbolo en un lienzo cuadrado MONO_SIZE x MONO_SIZE
  // con un padding del 15% (zona segura del adaptive icon).
  // 1) Calcular el bounding box del símbolo.
  let minX = src.width, minY = src.height, maxX = 0, maxY = 0;
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      if (dilated.data[((src.width * y + x) << 2) + 3] > 16) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) {
    throw new Error('No se pudo aislar el símbolo del logo.');
  }
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const cropped = new PNG({ width: cropW, height: cropH });
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = (src.width * (minY + y) + (minX + x)) << 2;
      const dstIdx = (cropW * y + x) << 2;
      cropped.data[dstIdx] = 255;
      cropped.data[dstIdx + 1] = 255;
      cropped.data[dstIdx + 2] = 255;
      cropped.data[dstIdx + 3] = dilated.data[srcIdx + 3];
    }
  }
  // 2) Redimensionar manteniendo proporción dentro de (MONO_SIZE * 0.70).
  const targetArea = Math.floor(MONO_SIZE * 0.70);
  const scale = Math.min(targetArea / cropW, targetArea / cropH);
  const newW = Math.max(1, Math.round(cropW * scale));
  const newH = Math.max(1, Math.round(cropH * scale));
  const resized = resampleBilinear(cropped, newW, newH);
  // 3) Pegar centrado en lienzo MONO_SIZE x MONO_SIZE transparente.
  const finalPng = new PNG({ width: MONO_SIZE, height: MONO_SIZE });
  for (let i = 0; i < finalPng.data.length; i += 4) {
    finalPng.data[i] = 255;
    finalPng.data[i + 1] = 255;
    finalPng.data[i + 2] = 255;
    finalPng.data[i + 3] = 0;
  }
  const offsetX = Math.floor((MONO_SIZE - newW) / 2);
  const offsetY = Math.floor((MONO_SIZE - newH) / 2);
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const srcIdx = (newW * y + x) << 2;
      const dstIdx = (MONO_SIZE * (offsetY + y) + (offsetX + x)) << 2;
      finalPng.data[dstIdx] = 255;
      finalPng.data[dstIdx + 1] = 255;
      finalPng.data[dstIdx + 2] = 255;
      finalPng.data[dstIdx + 3] = resized.data[srcIdx + 3];
    }
  }
  writePng(path.join(root, 'assets', 'android-icon-monochrome.png'), finalPng);
}

console.log('Generando android-icon-background.png...');
generateBackground();
console.log('Generando android-icon-monochrome.png...');
generateMonochrome();
console.log('Listo.');
