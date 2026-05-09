import { LitElement, html, css } from 'lit';
import { hexToRgb, rgbToHex, rgbToHsl, rgbToOklch, blend, luminance } from '../src/color.js';

/**
 * <result-panel bg="#fff" fg="#ff6b35" alpha="0.3" ?gamma="true">
 *
 * Показывает результат смешивания: hex, rgb, oklch, hsl, и сравнение "с/без гаммы".
 * Каждое значение кликабельно — копируется в буфер обмена.
 */
export class ResultPanel extends LitElement {
  static properties = {
    bg:    { type: String },
    fg:    { type: String },
    alpha: { type: Number },
    gamma: { type: Boolean, reflect: true, converter: v => v !== 'false' },
  };

  static styles = css`
    :host {
      display: block;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--surface, #fff);
      border: 1px solid var(--border, oklch(0.9 0 0));
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s;
      font-size: 0.82rem;
      line-height: 1.4;
    }
    .item:hover {
      background: var(--accent-soft, oklch(0.45 0 0 / 0.08));
    }
    .label {
      color: var(--muted, oklch(0.5 0 0));
      font-weight: 500;
    }
    .val {
      font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
      color: var(--text, #000);
    }
    .extra {
      margin-top: 8px;
      font-size: 0.72rem;
      color: var(--muted, oklch(0.5 0 0));
      display: flex;
      justify-content: space-between;
    }
  `;

  constructor() {
    super();
    this.bg = '#ffffff';
    this.fg = '#ff6b35';
    this.alpha = 0.3;
    this.gamma = true;
  }

  render() {
    const bg = hexToRgb(this.bg);
    const fg = hexToRgb(this.fg);
    const a = this.alpha;
    const useGamma = this.gamma;

    const curResult = blend(bg, fg, a, useGamma);
    const otherResult = blend(bg, fg, a, !useGamma);

    const r = Math.round(curResult[0]), g = Math.round(curResult[1]), b = Math.round(curResult[2]);
    const ro = Math.round(otherResult[0]), go = Math.round(otherResult[1]), bo = Math.round(otherResult[2]);

    const hex = rgbToHex(r, g, b);
    const rgb = `rgb(${r},${g},${b})`;
    const oklch = rgbToOklch(r, g, b);
    const hsl = rgbToHsl(r, g, b);

    const extraVal = useGamma
      ? `без гаммы: ${rgbToHex(ro, go, bo)}`
      : `с гаммой: ${rgbToHex(ro, go, bo)}`;
    const extraFormula = `linear RGB (γ=${useGamma ? '2.2' : '1.0'})`;

    return html`
      <div class="grid">
        ${[
          { label: 'HEX', val: hex },
          { label: 'RGB', val: rgb },
          { label: 'OKLCH', val: oklch },
          { label: 'HSL', val: hsl },
        ].map(item => html`
          <div class="item" @click=${this._copy} data-val=${item.val}>
            <span class="label">${item.label}</span>
            <span class="val">${item.val}</span>
          </div>
        `)}
      </div>
      <div class="extra">
        <span>${extraVal}</span>
        <span>${extraFormula}</span>
      </div>
    `;
  }

  _copy(e) {
    const val = e.currentTarget.dataset.val;
    navigator.clipboard.writeText(val);
    this.dispatchEvent(new CustomEvent('copy', { detail: val, bubbles: true, composed: true }));
  }
}

customElements.define('result-panel', ResultPanel);
