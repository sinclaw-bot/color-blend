import { LitElement, html, css } from 'lit';

/**
 * <copy-toast text="Скопировано!" visible></copy-toast>
 *
 * Показывается на пару секунд после копирования, потом исчезает.
 */
export class CopyToast extends LitElement {
  static properties = {
    text: { type: String },
    visible: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(80px);
      background: oklch(0.2 0 0);
      color: #fff;
      padding: 10px 24px;
      border-radius: 12px;
      font-size: 0.85rem;
      opacity: 0;
      transition: opacity 0.3s, transform 0.3s;
      pointer-events: none;
      z-index: 100;
    }
    :host([visible]) {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `;

  constructor() {
    super();
    this.text = 'Скопировано!';
    this.visible = false;
  }

  render() {
    return html`${this.text}`;
  }
}

customElements.define('copy-toast', CopyToast);
