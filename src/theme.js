/**
 * Тёмная тема — сохранение в localStorage и переключение.
 *
 * Добавляет/убирает класс `.dark` на <html>.
 */

const STORAGE_KEY = 'cblend-theme';

export function initTheme(buttonEl) {
  if (localStorage.getItem(STORAGE_KEY) === 'dark') {
    document.documentElement.classList.add('dark');
    buttonEl.textContent = '☀️';
  }

  buttonEl.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    buttonEl.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  });
}
