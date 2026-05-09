import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { blend, rgbToHex, hexToRgb, luminance } from '../src/color.js';

/**
 * <preview-split bg="#ff0000" fg="#00ff00" alpha="0.3" ?gamma="true" ?grid="false">
 *
 * Показывает две половины:
 *   1. CSS rgba — браузерное наложение в sRGB
 *   2. Результат — гамма-корректированное смешивание
 */
export class PreviewSplit extends LitElement {
  static properties = {
    bg:     { type: String },
    fg:     { type: String },
    alpha:  { type: Number },
    gamma:  { type: Boolean, reflect: true, converter: v => v !== 'false' },
    grid:   { type: Boolean, reflect: true, converter: v => v !== 'false' },
  };

  static styles = css`
    :host {
      display: block;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px oklch(0 0 0 / 0.04);
      margin-bottom: 28px;
    }
    .bar {
      display: flex;
      height: 200px;
    }
    .panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 14px;
      position: relative;
    }
    .panel + .panel {
      border-left: 1px solid var(--border, oklch(0.9 0 0));
    }
    .label {
      font-size: 0.65rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 2px 10px;
      border-radius: 6px;
      background: oklch(0 0 0 / 0.25);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      opacity: 0.75;
      z-index: 1;
    }
    .caption {
      padding: 10px 16px;
      display: flex;
    }
    .caption span {
      flex: 1;
      text-align: center;
      font-size: 0.72rem;
      font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
      color: var(--muted, oklch(0.5 0 0));
      cursor: pointer;
      padding: 2px 8px;
      border-radius: 4px;
      transition: background 0.15s;
    }
    .caption span:hover {
      background: var(--accent-soft, oklch(0.45 0 0 / 0.1));
    }
  `;

  constructor() {
    super();
    this.bg = '#ffffff';
    this.fg = '#ff6b35';
    this.alpha = 0.3;
    this.gamma = true;
    this.grid = false;
  }

  render() {
    const bg = hexToRgb(this.bg);
    const fg = hexToRgb(this.fg);
    const a = this.alpha;
    const useGamma = this.gamma;

    // CSS-панель (naive sRGB)
    const fgRgba = `rgba(${fg.join(',')},${a.toFixed(2)})`;
    let cssBg;
    if (this.grid) {
      cssBg = `linear-gradient(${fgRgba}, ${fgRgba}), repeating-conic-gradient(#b0b0b0 0% 25%, #d0d0d0 0% 50%) 0px 0px / 24px 24px`;
    } else {
      cssBg = `linear-gradient(${fgRgba}, ${fgRgba}), ${this.bg}`;
    }

    // Результат
    const result = blend(bg, fg, a, useGamma);
    const r = Math.round(result[0]), g = Math.round(result[1]), b = Math.round(result[2]);
    const hex = rgbToHex(r, g, b);

    // Адаптивный цвет лейблов
    const cssLum = luminance(
      Math.round(bg[0] * (1 - a) + fg[0] * a),
      Math.round(bg[1] * (1 - a) + fg[1] * a),
      Math.round(bg[2] * (1 - a) + fg[2] * a)
    );
    const solidLum = luminance(r, g, b);

    const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
    const cssCaption = `${this.bg} + ${this.fg}${alphaHex}`;

    return html`
      <div class="bar" part="bar">
        <div class="panel" style="background:${cssBg}" part="panel-css">
          <span class="label" style="color:${cssLum > 0.5 ? '#000' : '#fff'}" part="label">Браузер (CSS)</span>
        </div>
        <div class="panel" style="background:${hex}" part="panel-result">
          <span class="label" style="color:${solidLum > 0.5 ? '#000' : '#fff'}" part="label">Результат</span>
        </div>
      </div>
      <div class="caption" part="caption">
        <span @click=${this._copy} data-val=${cssCaption}>${cssCaption}</span>
        <span @click=${this._copy} data-val=${hex}>${hex}</span>
      </div>
    `;
  }

  _copy(e) {
    const val = e.currentTarget.dataset.val;
    navigator.clipboard.writeText(val);
    this.dispatchEvent(new CustomEvent('copy', { detail: val, bubbles: true, composed: true }));
  }
}

customElements.define('preview-split', PreviewSplit);
