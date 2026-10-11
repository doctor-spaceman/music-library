import { LitElement, createRef, css, html, nothing, ref, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/all/lit-all.min.js';
import { buttons, structure, typography } from '../assets/js/styles.js';
import { getLocalStorageWithExpiry, setLocalStorageWithExpiry } from '../assets/js/utils.js';

class MusicUserConfig extends LitElement {
  static properties = {
    username: {
      type: String,
      state: true
    },
  }

  constructor() {
    super();

    this.$inputRef = createRef();
    this.username = getLocalStorageWithExpiry('music_library_user');
  }

  connectedCallback() {
    super.connectedCallback();

    this.$musicGrid = document.querySelector('music-grid');
  }

  _clearUsername = () => {
    this.username = ''
    window.localStorage?.removeItem('music_library_user');
    this.$musicGrid?.clearGrid();
  }

  _enterUsername = () => {
    this.username = this.$inputRef.value.value;
    this.$musicGrid?.music_library_data?.user_name = this.username;
    setLocalStorageWithExpiry('music_library_user', this.username);
  }

  render() {
    return html`
      <div class="user-actions flex">
        <div class="user-actions__account flex flex-center">
          ${when(
            this.username?.length,
            () => html`
              <div class="user-actions__signed-in flex flex-column">
                <div class="user-actions__signed-in-name">
                  <span>ICON</span>
                  ${this.username}
                </div>
                <wa-button
                  class="user-actions__change-name button--simple"
                  @click=${this._clearUsername}
                >
                  Change
                </wa-button>
              </div>
            `,
            () => html`
              <wa-input
                class="user-actions__input-name"
                label="Discogs User"
                clearable
                pill
                @wa-clear=${() => console.log('cleared')}
                ${ref(this.$inputRef)}
              ></wa-input>
              <wa-button
                class="user-actions__enter-name"
                @click=${this._enterUsername}
              >
                Enter
              </wa-button>
            `
          )}
        </div>
      </div>
    `
  }

  static styles = [
    buttons,
    structure,
    typography,
    css`
      .user-actions {
        justify-content: flex-end;
      }
      .user-actions__account {
        align-items: flex-end;
        gap: var(--spacing-6);
      }
      .user-actions__change-name::part(base) {
        font-size: .8rem;
        text-decoration: underline;
        text-transform: uppercase;
      }
      .user-actions__signed-in {
        align-items: flex-end;
      }
      .user-actions__signed-in-name {
        svg {
        }
      }
    `
  ];
}
customElements.define('music-user-config', MusicUserConfig);