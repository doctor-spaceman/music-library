import { LitElement, createRef, css, html, ref, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/all/lit-all.min.js';
import { buttons, structure, typography, utilities } from '../assets/js/styles.js';
import { debounce, getLocalStorageWithExpiry, setLocalStorageWithExpiry } from '../assets/js/utils.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/button/button.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/input/input.js';

class MusicUserConfig extends LitElement {
  static properties = {
    username: {
      type: String,
      state: true
    },
    cdFolderId: {
      type: String,
      state: true
    },
    tapeFolderId: {
      type: String,
      state: true
    },
    vinylFolderId: {
      type: String,
      state: true
    },
  }

  constructor() {
    super();

    this.$usernameInputRef = createRef();
    this.username = getLocalStorageWithExpiry('music_library_user') || '';
    this.cdFolderId = '';
    this.tapeFolderId = '';
    this.vinylFolderId = '';
  }

  connectedCallback() {
    super.connectedCallback();

    this.$musicGrid = document.querySelector('music-grid');
    this.cdFolderId = this._getFolderId('cd');
    this.tapeFolderId = this._getFolderId('tape');
    this.vinylFolderId = this._getFolderId('vinyl');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  _clearUsername = () => {
    this.username = '';
  }

  _enterUsername = () => {
    this.username = this.$usernameInputRef.value.value;

    setLocalStorageWithExpiry('music_library_user', this.username);

    this.dispatchEvent(new CustomEvent('music-library:user-changed', {
      detail: {
        username: this.username,
      }
    }));
  }

  _getFolderId = (folderName) => {
    if (!this.$musicGrid) {
      return;
    }
    return this.$musicGrid.collectionData?.folders?.find(
      folder => folder.handle === folderName
    )?.id;
  }

  _addFolder = (event, folderName) => {
    const $currentInput = event.target?.closest(
      `.collection-item__folder[data-folder=${folderName}]`
    )?.querySelector(
      '.user-actions__input-folder wa-input'
    );
    
    const currentInputValue = $currentInput?.value
    if (currentInputValue?.length) {
      switch(folderName) {
        case 'cd':
          this.cdFolderId = currentInputValue;
          break;
        case 'tape':
          this.tapeFolderId = currentInputValue;
          break;
        case 'vinyl':
          this.vinylFolderId = currentInputValue;
          break;
      }

      this.dispatchEvent(new CustomEvent('music-library:folder-id-added', {
        detail: {
          folderName,
          folderId: currentInputValue
        }
      }));
    } else {
      const $errorMessage = event.target.closest(
        `[data-folder=${folderName}]`
      )?.querySelector(
        '.user-actions__input-error'
      );
      if ($errorMessage) {
        $errorMessage.textContent = 'Please input the numeric folder ID';
        $errorMessage.setAttribute('active', '');
      }
    }
  }

  _changeFolder = (event, folderName) => {
    const $folderToChange = event.target?.closest(
      `.collection-item__folder[data-folder=${folderName}]`
    );
    if ($folderToChange) {
      switch(folderName) {
        case 'cd':
          this.cdFolderId = '';
          break;
        case 'tape':
          this.tapeFolderId = '';
          break;
        case 'vinyl':
          this.vinylFolderId = '';
          break;
      }
    }

    this.dispatchEvent(new CustomEvent(
      'music-library:folder-id-cleared',
      { detail: { folderName } },
    ));
  }

  _handleInput = debounce((event, folderName) => {
    const inputValue = event.target?.value;
    const $errorMessage = event.target.closest(
      `[data-folder=${folderName}]`
    )?.querySelector(
      '.user-actions__input-error'
    );

    if ($errorMessage?.hasAttribute('active')) {
      $errorMessage.removeAttribute('active');
    }

    const $inputButton = event.target.closest(
      `[data-folder=${folderName}]`
    )?.querySelector(
      '.user-actions__add-folder'
    );
    const numbersOnlyRegex = /^\d*$/;
    if (inputValue) {
      if (!numbersOnlyRegex.test(inputValue)) {
        $errorMessage.textContent = 'Input must be a number';
        $errorMessage.setAttribute('active', '');
        $inputButton.disabled = true
      } else {
        $inputButton.disabled = false
      }
    }
  }, 800)

  _renderFolderAction(folderName, folderId) {
    console.log(folderName, folderId)
    return html`
      <tr
        class="collection-item__folder flex"
        data-folder=${folderName}
      >
        ${when(
          folderId?.length,
          () => html`
            <td class="collection-item__folder-name">
              <p>${folderName} folder ID:</p>
            </td>
            <td class="flex flex-center">
              <p>${folderId}</p>
            </td>
            <td class="flex flex-center">
              <wa-button
                class="user-actions__change-folder button--simple"
                @click=${(e) => this._changeFolder(e, folderName)}
              >
                Change
              </wa-button>
            </td>
          `,
          () => html`
            <td class="user-actions__input-folder">
              <wa-input
                inputmode="numeric"
                placeholder="${folderName} folder ID"
                @input=${(e) => this._handleInput(e, folderName)}
              >
                <slot name="label" class="sr-only">
                  ${folderName} folder ID
                </slot>
              </wa-input>
              <p class="user-actions__input-error p4"></p>
            </td>
            <td class="flex flex-center">
              <wa-button
                class="user-actions__add-folder button--simple"
                @click=${(e) => this._addFolder(e, folderName)}
              >
                Add
              </wa-button>
            </td>
          `
        )}
      </tr>
    `
  }

  render() {
    return html`
      <div class="user-actions flex">
        ${when(
          this.username?.length,
          () => html`
            <wa-accordion class="user-actions__collection">
              <wa-accordion-item
                class="user-actions__collection-item"
                label="Add records"
                ?expanded=${!this.$musicGrid?.collectionData?.folders?.some(
                  folder => folder.contents?.length
                )}
              >
                <table>
                  ${this._renderFolderAction('vinyl', this.vinylFolderId)}
                  ${this._renderFolderAction('cd', this.cdFolderId)}
                  ${this._renderFolderAction('tape', this.tapeFolderId)}
                </table>
              </wa-accordion-item>
            </wa-accordion>
          `,
          () => html`<p>Please enter an account name.</p>`
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
                ${ref(this.$usernameInputRef)}
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
    utilities,
    css`
      .user-actions {
        gap: var(--spacing-6);
        justify-content: flex-end;
      }
      .user-actions:has(.user-actions__collection) {
        @media screen and (min-width: 640px) {
          justify-content: space-between;
        }
      }
      .user-actions__account {
        align-items: flex-end;
        align-self: flex-start;
        gap: var(--spacing-6);
      }
      .user-actions__change-name::part(base) {
        font: var(--font-p-small);
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
      .user-actions__collection {
        order: 1;

        @media screen and (max-width: 639px) {
          width: 100%;
        }
        @media screen and (min-width: 640px) {
          order: 0;
        }
      }
      .user-actions__collection-item::part(label) {
        font: var(--font-h3);
        text-transform: uppercase;
      }
      .user-actions__collection-item table {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-6);

        @media screen and (min-width: 640px) {
          gap: var(--spacing-2);
        }
      }
      .collection-item__folder {
        align-items: flex-start;
        justify-content: space-between;
        flex-direction: column;
        flex-wrap: nowrap;

        @media screen and (min-width: 640px) {
          align-items: center;
          flex-direction: row;
          gap: var(--spacing-2);
        }

        p {
          margin: 0;
        }
        .collection-item__folder-name {
          flex: 1 1 auto;
          padding: 0;
          text-transform: uppercase;
        }
        .user-actions__input-folder wa-input::part(input)::placeholder {
          text-transform: uppercase;
        }
        .user-actions__add-folder {
          display: flex;
          align-items: center;
        }
      }
      .user-actions__input-error {
        color: #cf3a0d;
        height: 0;
        opacity: 0;
        padding-top: 0;
        transition: opacity .12s ease, height .12s ease, padding .12s ease;
      }
      .user-actions__input-error[active] {
        height: unset;
        opacity: 1;
        padding-top: var(--spacing-1);
      }
    `
  ];
}
customElements.define('music-user-config', MusicUserConfig);