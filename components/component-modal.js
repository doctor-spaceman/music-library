import { LitElement, css, html, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/all/lit-all.min.js';
import { structure, typography } from '../assets/js/styles.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/button/button.js';

class MusicModal extends LitElement {
  static properties = {
    requestFailed: {
      type: String,
      state: true
    }
  }

  constructor() {
    super();

    this.requestFailed = false;
  }

  connectedCallback() {
    super.connectedCallback();

    this.$musicGrid = document.querySelector('music-grid');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has('requestFailed')) {
      console.log('Request failed updated in modal', this.requestFailed)   
    }
  }

  _closeModal = () => {
    this.classList.add('hidden');
    this.requestFailed = false;
    this.$musicGrid.requestFailed = this.requestFailed;
  }

  render() {
    return html`
      <div class="modal-content flex flex-column flex-center">
        ${when(
          this.requestFailed,
          () => html`
            <svg xmlns="http://www.w3.org/2000/svg" width="80" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
            </svg>
            <p class="modal-content__error-message">The request could not complete. Please check the folder ID and try again.</p>
            <wa-button
              class="modal-content__close-button"
              @click=${this._closeModal}
            >
              Okay
            </wa-button>
          `,
          () => html`
            <img
              width="80"
              src="./assets/img/record-player-pixel-art.gif"
              alt="Graphic of a turntable with a spinning record"
            />
            <p>Loading ...</p>
          `
        )}
      </div>
    `
  }

  static styles = [
    structure,
    typography,
    css`
      :host {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #00000025;
        height: 100vh;
        width: 100%;
      }
      .modal-content {
        background-color: var(--color-light-primary);
        border: 1px solid var(--color-dark-primary);
        border-radius: var(--wa-panel-border-radius);
        height: auto;
        padding: var(--spacing-5);
        width: 280px;
      }
      .modal-content__close-button {
        text-transform: uppercase;
      }
    `
  ];
}
customElements.define('music-modal', MusicModal);