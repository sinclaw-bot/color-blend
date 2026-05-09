import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import './preview-split.js';
import './result-panel.js';
import './copy-toast.js';

const STORAGE_KEY = 'cblend-state';

/**
 * <color-blend-app></color-blend-app>
 *
 * Главный компонент приложения. Содержит всё состояние (цвета, ползунок, гамму, грид, тему).
 * Сохраняет состояние в localStorage.
 */
export class ColorBlendApp extends LitElement {
  static properties = {
    bgColor:   { type: String },
    fgColor:   { type: String },
    alpha:     { type: Number },
    gamma:     { type: Boolean },
    grid:      { type: Boolean },
    dark:      { type: Boolean, reflect: true },
    toastText: { type: String },
    toastVisible: { type: Boolean },
    _toastTimer: { attribute: false },
  };

  static styles = css`
    :host {
      --bg: oklch(0.97 0 0);
      --surface: oklch(1 0 0);
      --text: oklch(0.2 0 0);
      --muted: oklch(0.5 0 0);
      --border: oklch(0.9 0 0);
      --accent: oklch(0.45 0 0);
      --accent-soft: oklch(0.45 0 0 / 0.1);
      --shadow: 0 4px 24px oklch(0 0 0 / 0.04);
      --radius: 16px;
      display: block;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      transition: background 0.3s, color 0.3s;
      padding: 40px 16px 60px;
    }
    :host([dark]) {
      --bg: oklch(0.15 0 0);
      --surface: oklch(0.2 0 0);
      --text: oklch(0.95 0 0);
      --muted: oklch(0.65 0 0);
      --border: oklch(0.3 0 0);
      --shadow: 0 4px 24px oklch(0 0 0 / 0.2);
    }

    .container {
      max-width: 680px;
      margin: 0 auto;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .top-btns {
      display: flex;
      gap: 8px;
    }
    .icon-btn {
      background: none;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 1rem;
      color: var(--text);
      transition: background 0.15s;
    }
    .icon-btn:hover {
      background: var(--accent-soft);
    }

    .controls {
      background: var(--surface);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow);
      margin-bottom: 28px;
      transition: background 0.3s;
    }
    .color-row {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      align-items: center;
    }
    .color-row label {
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--muted);
      min-width: 20px;
    }
    .color-row input[type="color"] {
      width: 48px;
      height: 40px;
      padding: 2px;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      background: none;
    }
    .color-row input[type="text"] {
      flex: 1;
      padding: 8px 12px;
      font-size: 0.82rem;
      font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg);
      color: var(--text);
      outline: none;
      transition: border-color 0.15s;
    }
    .color-row input[type="text"]:focus {
      border-color: var(--accent);
    }

    .alpha-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .alpha-row label {
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--muted);
    }
    .alpha-row input[type="range"] {
      flex: 1;
      accent-color: var(--accent);
    }
    .alpha-row .val {
      font-family: 'SF Mono', monospace;
      font-size: 0.82rem;
      min-width: 40px;
      text-align: right;
    }

    .options {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .option {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      color: var(--muted);
      cursor: pointer;
    }
    .option input {
      accent-color: var(--accent);
    }

    .presets {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .preset {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: border-color 0.15s, transform 0.15s;
    }
    .preset:hover {
      transform: scale(1.12);
    }
    .preset.active {
      border-color: var(--accent);
    }

    .section-title {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin: 0 0 12px;
    }

    .result-section {
      background: var(--surface);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow);
      transition: background 0.3s;
    }
  `;

  constructor() {
    super();
    this.bgColor = '#ffffff';
    this.fgColor = '#ff6b35';
    this.alpha = 30;
    this.gamma = true;
    this.grid = false;
    this.dark = false;
    this.toastText = 'Скопировано!';
    this.toastVisible = false;
    this._toastTimer = null;

    this._loadState();
  }

  _loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.bg) this.bgColor = s.bg;
        if (s.fg) this.fgColor = s.fg;
        if (s.alpha != null) this.alpha = s.alpha;
        if (s.gamma != null) this.gamma = s.gamma;
        if (s.grid != null) this.grid = s.grid;
        if (s.dark != null) this.dark = s.dark;
        if (this.dark) this.setAttribute('dark', '');
      } catch {}
    }
  }

  _saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      bg: this.bgColor,
      fg: this.fgColor,
      alpha: this.alpha,
      gamma: this.gamma,
      grid: this.grid,
      dark: this.dark,
    }));
  }

  _onInput(e) {
    const { name, value, checked } = e.target;
    if (name === 'alpha') this.alpha = Number(value);
    else if (name === 'gamma') this.gamma = checked;
    else if (name === 'grid') this.grid = checked;
    else if (name === 'bg') this.bgColor = value;
    else if (name === 'fg') this.fgColor = value;
    else if (name === 'bgHex' && /^#[0-9a-f]{6}$/i.test(value)) this.bgColor = value;
    else if (name === 'fgHex' && /^#[0-9a-f]{6}$/i.test(value)) this.fgColor = value;
    this._saveState();
  }

  _toggleTheme() {
    this.dark = !this.dark;
    if (this.dark) this.setAttribute('dark', '');
    else this.removeAttribute('dark');
    this._saveState();
  }

  _onCopy(e) {
    this.toastText = `Скопировано: ${e.detail}`;
    this.toastVisible = true;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { this.toastVisible = false; }, 1500);
  }

  _setPreset(color) {
    this.bgColor = color;
    this._saveState();
  }

  /** Normalise alpha для передачи в компоненты (0–1) */
  get _alphaNorm() {
    return this.alpha / 100;
  }

  get _alphaDsp() {
    return this._alphaNorm.toFixed(2);
  }

  render() {
    const presets = ['#ffffff', '#ffd9a0', '#f5f5f5', '#1a1a2e', '#16213e', '#0f3460', '#e94560', '#2d6a4f'];

    return html`
      <div class="container">
        <div class="header-actions">
          <h1>🎨 Color Blend</h1>
          <div class="top-btns">
            <button class="icon-btn" @click=${this._toggleTheme}>${this.dark ? '☀️' : '🌙'}</button>
            <button class="icon-btn" @click=${() => window.openInfo()}>ⓘ</button>
          </div>
        </div>

        <div class="controls">
          <div class="section-title">Пресеты фона</div>
          <div class="presets">
            ${presets.map(c => html`
              <button
                class="preset ${classMap({ active: this.bgColor === c })}"
                style="background:${c}"
                @click=${() => this._setPreset(c)}
              ></button>
            `)}
          </div>

          <div class="color-row">
            <label for="bg">Фон</label>
            <input type="color" id="bg" name="bg" .value=${this.bgColor} @input=${this._onInput}>
            <input type="text" name="bgHex" .value=${this.bgColor} @input=${this._onInput}>
          </div>

          <div class="color-row">
            <label for="fg">Слой</label>
            <input type="color" id="fg" name="fg" .value=${this.fgColor} @input=${this._onInput}>
            <input type="text" name="fgHex" .value=${this.fgColor} @input=${this._onInput}>
          </div>

          <div class="alpha-row">
            <label>Непрозрачность</label>
            <input type="range" name="alpha" min="0" max="100" .value=${this.alpha} @input=${this._onInput}>
            <span class="val">${this._alphaDsp}</span>
          </div>

          <div class="options">
            <label class="option">
              <input type="checkbox" name="gamma" ?checked=${this.gamma} @change=${this._onInput}>
              γ-коррекция (γ=2.2)
            </label>
            <label class="option">
              <input type="checkbox" name="grid" ?checked=${this.grid} @change=${this._onInput}>
              Шахматный фон
            </label>
          </div>
        </div>

        <preview-split
          bg=${this.bgColor}
          fg=${this.fgColor}
          alpha=${this._alphaNorm}
          ?gamma=${this.gamma}
          ?grid=${this.grid}
          @copy=${this._onCopy}
        ></preview-split>

        <div class="result-section">
          <div class="section-title">Результат</div>
          <result-panel
            bg=${this.bgColor}
            fg=${this.fgColor}
            alpha=${this._alphaNorm}
            ?gamma=${this.gamma}
            @copy=${this._onCopy}
          ></result-panel>
        </div>
      </div>

      <copy-toast .text=${this.toastText} .visible=${this.toastVisible}></copy-toast>
    `;
  }
}

customElements.define('color-blend-app', ColorBlendApp);
