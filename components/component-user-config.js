import { LitElement, createRef, css, html, ref, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/all/lit-all.min.js';
import { buttons, structure, typography, utilities } from '../assets/js/styles.js';
import { debounce } from '../assets/js/utils.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/button/button.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/input/input.js';

class MusicUserConfig extends LitElement {
  static properties = {
    authorized: {
      type: Boolean,
      state: true
    },
    username: {
      type: String,
      state: true
    }
  }

  constructor() {
    super();

    this.authorized = false;
    this.cloudUrl = 'https://discogs-oauth-irmuxojohq-wl.a.run.app';
    this.userAgent = 'MusicLibrary/1.0 +https://mattmclean.net';
    this.$usernameInputRef = createRef();
    if (window.localStorage.getItem('music-library-user')) {
      this.username = JSON.parse(window.localStorage.getItem('music-library-user')) || '';
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.$musicGrid = document.querySelector('music-grid');
    this.authVerifier = this._setAuthValue('verifier');
    this.authToken = this._setAuthValue('token');
    this.authTokenSecret = this._setAuthValue('token_secret');
    window.history.replaceState({}, document.title, `${window.location.href.split('?')[0]}` );
    this._authorizeAccess();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  _authorizeAccess = async () => {
    if (
      window.localStorage.getItem('music_library_oauth_token') &&
      window.localStorage.getItem('music_library_oauth_token_secret')
    ) {
      // We already have non-expiring API credentials
      this.authorized = true;
      return;
    }

    if (this.authVerifier && this.authToken && this.authTokenSecret) {
      // access token
      try {
        const authResponse = await fetch(this.cloudUrl, {
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
          body: JSON.stringify({
            requestType: 'access',
            token: this.authToken,
            tokenSecret: this.authTokenSecret,
            verifier: this.authVerifier,
          })
        });
        if (authResponse.ok) {
          const authResponseParsed = await authResponse.text();
          this.authToken = authResponseParsed?.split('oauth_token=')[1]?.split('&')[0];
          this.authTokenSecret = authResponseParsed?.split('oauth_token_secret=')[1]?.split('&')[0];
          if (this.authTokenSecret && this.authTokenSecret) {
            try {
              // Persist these; they won't expire unless user revokes access
              window.localStorage.setItem('music_library_oauth_token', JSON.stringify(this.authToken));
              window.localStorage.setItem('music_library_oauth_token_secret', JSON.stringify(this.authTokenSecret));
              this.authorized = true;
              this._getIdentity();
            } catch (error) {
              console.warn('Could not add API credentials to localStorage.')
              console.log(error.message)
            }
          }
        } else {
          if (authResponse.status === 401) {
            this.authorized = false;
            window.localStorage.removeItem('music_library_oauth_token');
            window.localStorage.removeItem('music_library_oauth_verifier');
            throw new Error(`The service responded with ${authResponse.status}. Please re-authorize.`);
          } else {
            throw new Error(`The service responded with ${authResponse.status}.`);
          }
        }
      } catch (error) {
        console.warn(error.message);
      }
    }
  }

  _authorizeRequest = async () => {
    // request token
    const response = await fetch(this.cloudUrl, {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({
        requestType: 'request'
      }),
    });
    if (response?.ok) {
      const responseParsed = await response.json()
      if (responseParsed) {
        console.log('responseParsed:', responseParsed);
        try {
          window.localStorage.setItem('music_library_oauth_token_secret', JSON.stringify(responseParsed.oauth_token_secret));
        } catch (error) {
          console.warn('Could not add API credentials to localStorage.')
        }
        window.location = `https://www.discogs.com/oauth/authorize?oauth_token=${responseParsed.oauth_token}`;
      }
    }
  }

  _getIdentity = async () => {
    try {
      let identity = {};
      const identityResponse = await fetch(this.cloudUrl, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({
          requestType: 'identity',
          token: this.authToken,
          tokenSecret: this.authTokenSecret,
        }),
      });
      if (identityResponse) {
        identity = await identityResponse.json();
        if (identity) {
          this.username = identity.username;
          this.dispatchEvent(new CustomEvent('music-library:user-changed', {
            detail: {
              username: this.username,
            }
          }));
          try {
            window.localStorage.setItem('music_library_user', JSON.stringify(this.username))
          } catch (error) {
            console.warn('Could not add username to localStorage')
            console.log(error.mesasge)
          }
        }
      }
    } catch (error) {
      console.warn('Identity verification failed');
      console.log(error.message);
    }
  }

  _setAuthValue = (name) => {
    let value = window.localStorage.getItem(`music_library_oauth_${name}`);
    if (value) {
      value = JSON.parse(value);
    }
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has(`oauth_${name}`)) {
      value = urlParams.get(`oauth_${name}`);
    }
    return value ?? null;
  }

  _logout = () => {
    this.username = '';
    this.dispatchEvent(new CustomEvent('music-library:user-changed', {
      detail: {
        username: this.username,
      }
    }));
    window.localStorage.removeItem('music_library_user');
    window.localStorage.removeItem('music_library_oauth_token');
    window.localStorage.removeItem('music_library_oauth_token_secret');
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

  render() {
    return html`
      <div class="user-actions flex">
        <div class="user-actions__account flex flex-center">
          ${when(
            this.username?.length,
            () => html`
              <div class="user-actions__signed-in flex flex-center">
                <div class="user-actions__signed-in-name flex flex-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  ${this.username}
                </div>
                <wa-button
                  class="user-actions__logout button--simple"
                  @click=${this._logout}
                >
                  Log Out
                </wa-button>
              </div>
            `,
            () => html`
              <wa-button
                class="user-actions__login"
                @click=${this._authorizeRequest}
              >
                Log In
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
      .user-actions__account {
        align-items: flex-end;
        align-self: flex-start;
        gap: var(--spacing-6);
      }
      .user-actions__logout::part(base) {
        font: var(--font-p-small);
      }
      .user-actions__input-name::part(label) {
        font: var(--font-p-small);
        text-transform: uppercase;
      }
      .user-actions__signed-in {
        gap: var(--spacing-2);
      }
      .user-actions__signed-in-name {
        gap: var(--spacing-2);

        svg {
          aspect-ratio: 1;
          width: calc(var(--size) * 1.4);
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