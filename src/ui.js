/**
 * UI-вспомогательные функции: пресеты, тост, информационная модалка.
 */

/** Инициализация пресетов фона. @param {NodeList} presetButtons - .bg-preset элементы */
export function initPresets(presetButtons, bgColor, bgHex, onUpdate) {
  presetButtons.forEach(btn => {
    btn.style.background = btn.dataset.color;
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      bgColor.value = btn.dataset.color;
      bgHex.value = btn.dataset.color;
      onUpdate();
    });
  });
}

/** Создаёт функцию показа тоста. */
export function createToast(toastEl) {
  return function showToast(text) {
    navigator.clipboard.writeText(text).then(() => {
      toastEl.textContent = text;
      toastEl.classList.add('show');
      clearTimeout(toastEl._timer);
      toastEl._timer = setTimeout(() => toastEl.classList.remove('show'), 1500);
    });
  };
}

/** Инициализация модалки с информацией. */
export function initInfoModal() {
  const overlay = document.getElementById('infoModal');
  window.openInfo = () => overlay.classList.add('open');
  window.closeInfo = () => overlay.classList.remove('open');
  overlay.addEventListener('click', e => {
    if (e.target === overlay) window.closeInfo();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.closeInfo();
  });
}
