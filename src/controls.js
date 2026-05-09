/**
 * Привязка input-элементов к обновлению UI.
 * Сохраняет состояние формы в localStorage.
 */

const STATE_KEY = 'cblend-state';

export function initControls(refs, onUpdate) {
  const { bgColor, fgColor, bgHex, fgHex, slider, gammaCheck, showGrid } = refs;

  // Загрузка сохранённого состояния
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_KEY));
    if (saved) {
      if (saved.bg) { bgColor.value = bgHex.value = saved.bg; }
      if (saved.fg) { fgColor.value = fgHex.value = saved.fg; }
      if (saved.alpha != null) slider.value = saved.alpha;
      if (saved.gamma != null) gammaCheck.checked = saved.gamma;
      if (saved.grid != null) showGrid.checked = saved.grid;
    }
  } catch {}

  const save = () => {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      bg: bgColor.value,
      fg: fgColor.value,
      alpha: slider.value,
      gamma: gammaCheck.checked,
      grid: showGrid.checked,
    }));
  };

  const update = () => { save(); onUpdate(); };

  bgColor.addEventListener('input', () => { bgHex.value = bgColor.value; update(); });
  bgHex.addEventListener('input', () => {
    if (/^#[0-9a-f]{6}$/i.test(bgHex.value)) {
      bgColor.value = bgHex.value;
      update();
    }
  });
  fgColor.addEventListener('input', () => { fgHex.value = fgColor.value; update(); });
  fgHex.addEventListener('input', () => {
    if (/^#[0-9a-f]{6}$/i.test(fgHex.value)) {
      fgColor.value = fgHex.value;
      update();
    }
  });
  slider.addEventListener('input', update);
  gammaCheck.addEventListener('change', update);
  showGrid.addEventListener('change', update);
}
