/**
 * Silencia warnings ruidosos y cosméticos de React Native Web 0.21+ que no
 * afectan la funcionalidad (los estilos `shadow_` y `textShadow_` aún
 * funcionan correctamente).
 *
 * Importar este archivo UNA SOLA VEZ desde `App.tsx` (al inicio).
 */

import { Platform } from 'react-native';

const SILENCED_PATTERNS: RegExp[] = [
  /"shadow\*" style props are deprecated/i,
  /"textShadow\*" style props are deprecated/i,
  /props\.pointerEvents is deprecated/i,
  /useNativeDriver.*is not supported/i,
];

let installed = false;

export function installWebWarningFilter(): void {
  if (installed) return;
  installed = true;

  if (Platform.OS !== 'web') return;
  if (typeof console === 'undefined') return;

  const originalWarn = console.warn?.bind(console);
  if (!originalWarn) return;

  console.warn = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string') {
      for (const pat of SILENCED_PATTERNS) {
        if (pat.test(first)) return;
      }
    }
    originalWarn(...(args as []));
  };
}
