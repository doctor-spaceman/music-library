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

  updated(changedProperties) {
    if (changedProperties.has('username')) {
      this.$musicGrid.music_library_user = this.username;
    }
  }

  _clearUsername = () => {
    this.username = '';
  }

  _enterUsername = () => {
    this.username = this.$inputRef.value.value;
    setLocalStorageWithExpiry('music_library_user', this.username);
  }

  render() {
    return html`
      <div class="user-actions flex">
        ${when(
          this.username?.length,
          () => html`
            <wa-accordion class="user-actions__folders">
              <wa-accordion-item
                label="Add records"
                ?expanded=${!this.$musicGrid?.music_library_data?.folders?.length}
              >
                <div class="flex">
                  <wa-input
                    class="user-actions__input-record"
                    label="Vinyl folder ID"
                    clearable
                    pill
                    @wa-clear=${() => console.log('cleared')}
                    ${ref(this.$inputRef)}
                  ></wa-input>
                  <wa-button
                    class="user-actions__add-record button--simple"
                    @click=${() => {}}
                  >
                    Add
                  </wa-button>
                </div>
                <div class="flex">
                  <wa-input
                    class="user-actions__input-record"
                    label="CD folder ID"
                    clearable
                    pill
                    @wa-clear=${() => console.log('cleared')}
                    ${ref(this.$inputRef)}
                  ></wa-input>
                  <wa-button
                    class="user-actions__add-record button--simple"
                    @click=${() => {}}
                  >
                    Add
                  </wa-button>
                </div>
                <div class="flex">
                  <wa-input
                    class="user-actions__input-record"
                    label="Cassette folder ID"
                    clearable
                    pill
                    @wa-clear=${() => console.log('cleared')}
                    ${ref(this.$inputRef)}
                  ></wa-input>
                  <wa-button
                    class="user-actions__add-record button--simple"
                    @click=${() => {}}
                  >
                    Add
                  </wa-button>
                </div>
              </wa-accordion-item>
            </wa-accordion>
          `,
          () => nothing,
        )}
        <div class="user-actions__account flex flex-center">
          ${when(
            this.username?.length,
            () => html`
              <div class="user-actions__signed-in flex flex-column">
                <div class="user-actions__signed-in-name flex flex-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
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
      .user-actions:has(.user-actions__folders) {
        justify-content: space-between;
      }
      .user-actions__account {
        align-items: flex-end;
        align-self: flex-start;
        gap: var(--spacing-6);
      }
      .user-actions__change-name::part(base) {
        font: var(--font-p-small);
        text-decoration: underline;
        text-transform: uppercase;
      }
      .user-actions__input-name::part(label) {
        font: var(--font-p-small);
        text-transform: uppercase;
      }
      .user-actions__signed-in {
        align-items: flex-end;
      }
      .user-actions__signed-in-name {
        gap: var(--spacing-2);

        svg {
          aspect-ratio: 1;
          width: calc(var(--size) * 1.4);
        }
      }
    `
  ];
}
customElements.define('music-user-config', MusicUserConfig);