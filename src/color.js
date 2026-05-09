/**
 * Цветовые преобразования и гамма-коррекция.
 *
 * Человеческий глаз воспринимает яркость нелинейно — sRGB использует
 * гамма-кодирование (≈2.2). При смешивании цветов нужно перевести в
 * линейное пространство, смешать, затем вернуть обратно.
 *
 *   decode: linear = pow(sRGB, γ)
 *   encode: sRGB = pow(linear, 1/γ)
 */

export const GAMMA = 2.2;

/** #RRGGBB → [R, G, B] (0–255) */
export function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/** [R, G, B] → #RRGGBB */
export function rgbToHex(r, g, b) {
  const clamp = x => Math.max(0, Math.min(255, Math.round(x)));
  return '#' + [r, g, b].map(c => clamp(c).toString(16).padStart(2, '0')).join('');
}

/**
 * Относительная яркость по ITU-R BT.601.
 * Используется для выбора контрастного цвета текста на лейблах.
 */
export function luminance(r, g, b) {
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
}

/**
 * Alpha compositing (src-over).
 *
 * @param bg - цвет фона [R, G, B]
 * @param fg - накладываемый цвет [R, G, B]
 * @param alpha - непрозрачность (0–1)
 * @param useGamma - true = γ=2.2, false = γ=1 (naive sRGB)
 * @returns [R, G, B]
 */
export function blend(bg, fg, alpha, useGamma) {
  const G = useGamma ? GAMMA : 1;
  return bg.map((b, i) => {
    const bLin = Math.pow(b / 255, G);
    const fLin = Math.pow(fg[i] / 255, G);
    return Math.pow(bLin * (1 - alpha) + fLin * alpha, 1 / G) * 255;
  });
}

/** RGB → HSL (для отображения) */
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0, l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = (mx === r ? (g - b) / d + (g < b ? 6 : 0)
       : mx === g ? (b - r) / d + 2
                 : (r - g) / d + 4) * 60;
  }
  return `hsl(${Math.round(h)}deg ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

/**
 * RGB → OKLCH — восприимчиво-линейное цветовое пространство.
 *
 * OKLCH ближе всего к человеческому восприятию. Полезен при подборе
 * гармоничных оттенков и оценке различий между цветами.
 *
 * Алгоритм: sRGB → linear → LMS (через матрицу) → OKLab → OKLCH (полярные)
 */
export function rgbToOklch(r, g, b) {
  // Piecewise sRGB → linear (точнее чем простой pow)
  const lin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  let lr = lin(r / 255), lg = lin(g / 255), lb = lin(b / 255);

  // Linear sRGB → LMS (конусы глаза, матрица от Björn Ottosson)
  let L = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  let M = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  let S = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  // LMS → OKLab (кубический корень)
  L = Math.cbrt(L); M = Math.cbrt(M); S = Math.cbrt(S);

  // OKLab → OKLCH (декартовы → полярные)
  const l_ = 0.2104542553 * L + 0.7936177850 * M - 0.0040720468 * S;
  const a = 1.9779984951 * L - 2.4285922050 * M + 0.4505937099 * S;
  const b_ = 0.0259040371 * L + 0.7827717662 * M - 0.8086757660 * S;

  const C = Math.sqrt(a * a + b_ * b_);
  let h = Math.atan2(b_, a) * 180 / Math.PI;
  if (h < 0) h += 360;

  return `oklch(${l_.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(1)}deg)`;
}
