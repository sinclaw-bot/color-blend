/**
 * Color Blend — главный модуль приложения.
 *
 * Архитектура:
 *   app.js      — оркестрация, render loop, DOM-ссылки
 *   color.js    — цветовые преобразования (hex, rgb, oklch, hsl, blend)
 *   controls.js — привязка input-элементов
 *   theme.js    — тёмная тема
 *   ui.js       — пресеты, тост, модалка
 */

import { hexToRgb, rgbToHex, luminance, blend, rgbToOklch, rgbToHsl } from './color.js';
import { initTheme } from './theme.js';
import { initControls } from './controls.js';
import { initPresets, createToast, initInfoModal } from './ui.js';

// DOM-ссылки — один объект, не размазывать по глобальным переменным
const $ = id => document.getElementById(id);
const refs = {
  bgColor:   $('bgColor'),
  fgColor:   $('fgColor'),
  bgHex:     $('bgHex'),
  fgHex:     $('fgHex'),
  slider:    $('opacitySlider'),
  opacityDsp: $('opacityDisplay'),
  gammaCheck: $('gammaCorrect'),
  showGrid:  $('showGrid'),
  themeBtn:  $('themeToggle'),
  bgPresets: document.querySelectorAll('.bg-preset'),
  panelCss:  $('panelCss'),
  panelSolid: $('panelSolid'),
  capCss:    $('capCss'),
  capSolid:  $('capSolid'),
  labels:    document.querySelectorAll('.preview-panel-label'),
  elHex:     $('resultHex'),
  elRgb:     $('resultRgb'),
  elOklch:   $('resultOklch'),
  elHsl:     $('resultHsl'),
  extraLin:  $('extraLinear'),
  extraFrm:  $('extraFormula'),
  toast:     $('toast'),
};

/**
 * Главный рендер. Вызывается при любом изменении: инпуты, пресеты, ресайз.
 */
function render() {
  const bg = hexToRgb(refs.bgColor.value);
  const fg = hexToRgb(refs.fgColor.value);
  const alpha = parseInt(refs.slider.value) / 100;
  const useGamma = refs.gammaCheck.checked;
  const grid = refs.showGrid.checked;

  refs.opacityDsp.textContent = alpha.toFixed(2);

  // Результат — с той гаммой, которую выбрал пользователь
  // Для «без гаммы» считаем отдельно, чтобы показать разницу
  const curResult = blend(bg, fg, alpha, useGamma);
  const otherResult = blend(bg, fg, alpha, !useGamma);

  const r = Math.round(curResult[0]), g = Math.round(curResult[1]), b = Math.round(curResult[2]);
  const hex = rgbToHex(r, g, b);

  // === Панель 1: CSS rgba (naive sRGB) ===
  const fgRgba = `rgba(${fg.join(',')},${alpha.toFixed(2)})`;
  refs.panelCss.style.background = grid
    ? `linear-gradient(${fgRgba}, ${fgRgba}), repeating-conic-gradient(#b0b0b0 0% 25%, #d0d0d0 0% 50%) 0px 0px / 24px 24px`
    : `linear-gradient(${fgRgba}, ${fgRgba}), ${refs.bgColor.value}`;

  // === Панель 2: Solid результат ===
  refs.panelSolid.style.background = hex;

  // === Адаптивный цвет лейблов ===
  const cssLum = luminance(
    Math.round(bg[0] * (1 - alpha) + fg[0] * alpha),
    Math.round(bg[1] * (1 - alpha) + fg[1] * alpha),
    Math.round(bg[2] * (1 - alpha) + fg[2] * alpha)
  );
  const solidLum = luminance(r, g, b);
  refs.labels[0].style.color = cssLum   > 0.5 ? '#000' : '#fff';
  refs.labels[1].style.color = solidLum > 0.5 ? '#000' : '#fff';

  // === Подписи ===
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  refs.capCss.textContent   = `${refs.bgColor.value} + ${refs.fgColor.value}${alphaHex}`;
  refs.capSolid.textContent = hex;

  // === Детальный результат ===
  const ro = Math.round(otherResult[0]), go = Math.round(otherResult[1]), bo = Math.round(otherResult[2]);
  refs.elHex.textContent   = hex;
  refs.elRgb.textContent   = `rgb(${r},${g},${b})`;
  refs.elOklch.textContent = rgbToOklch(r, g, b);
  refs.elHsl.textContent   = rgbToHsl(r, g, b);

  // data-val для копирования по клику
  document.querySelectorAll('.result-value-item').forEach(el => {
    el.dataset.val = el.querySelector('.val').textContent;
  });

  refs.extraLin.textContent = useGamma
    ? `без гаммы: ${rgbToHex(ro, go, bo)}`
    : `с гаммой:  ${rgbToHex(ro, go, bo)}`;
  refs.extraFrm.textContent = `linear RGB (γ=${useGamma ? '2.2' : '1.0'})`;
}

// ===== Инициализация =====

initTheme(refs.themeBtn);
initControls(refs, render);
initPresets(refs.bgPresets, refs.bgColor, refs.bgHex, render);
initInfoModal();

const showToast = createToast(refs.toast);
window.copyText = showToast;

// Debounced ресайз
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 80);
});

render();
