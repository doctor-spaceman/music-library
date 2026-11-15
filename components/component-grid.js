import { LitElement, classMap, createRef, css, html, nothing, ref, repeat, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/all/lit-all.min.js';
import { structure, theme, typography, utilities } from '../assets/js/styles.js';
import { debounce, getLocalStorageWithExpiry, setLocalStorageWithExpiry } from '../assets/js/utils.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/accordion/accordion.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/button/button.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/input/input.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/tab/tab.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/tab-group/tab-group.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/tab-panel/tab-panel.js';

class MusicGrid extends LitElement {
  static properties = {
    dataReady: {
      type: Boolean,
      state: true
    },
    requesting: {
      type: Boolean,
      state: true
    },
    requestFailed: {
      type: Boolean,
      state: true
    },
    collectionData: {
      type: Object,
      state: true
    },
    filteredFolder: {
      type: Object,
      state: true
    },
    originalFolder: {
      type: Object,
      state: true
    },
    selectedFolder: {
      type: Object,
      state: true
    },
    randomResult: {
      type: Object,
      state: true
    },
    searchQuery: {
      type: String,
      state: true
    },
    username: {
      type: String,
      state: true
    },
  }

  constructor() {
    super();

    this.apiOrigin = 'https://api.discogs.com';
    this.cloudUrl = 'https://discogs-oauth-irmuxojohq-wl.a.run.app';
    this.userAgent = 'MusicLibrary/1.0 +https://mattmclean.net';

    this.currentDate = new Date();
    this.dataReady = false;
    this.requesting = false;
    this.requestFailed = false;
    this.filteredFolder = {};
    this.originalFolder = {};
    this.selectedFolder = {};
    this.collectionData = { folders: [] };
    this.randomResult = {};
    this.searchQuery = '';
    this.username = '';
  }

  connectedCallback() {
    super.connectedCallback();

    this.$modal = document.querySelector('music-modal');
    this.$userConfig = document.querySelector('music-user-config');
    this.$userConfig.addEventListener(
      'music-library:user-changed',
      (event) => {
        this.username = event.detail?.username;
        if (this.username?.length) {
          this._setupGrid();
        } else {
          this._clearGrid();
        }
      }
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // TODO: this.$userConfig.removeEventListener
  }

  updated(changedProperties) {
    if (changedProperties.has('requesting')) {
      console.log(this.requesting)
      if (this.$modal) {
        if (this.requesting) {
          this.$modal.classList.remove('hidden');
        } else {
          if (!this.requestFailed) {
            this.$modal.classList.add('hidden');
          }
        }
      }
    }

    if (changedProperties.has('requestFailed')) {
      if (this.$modal && this.requestFailed) {
        this.$modal.requestFailed = this.requestFailed
      }
    }
  }

  _setupGrid = async () => {
    this.currentDate = new Date();
    this.requesting = true;

    // Check if we already have unexpired data
    const storedMusicLibraryData = getLocalStorageWithExpiry('music_library_data');
    if (!storedMusicLibraryData) {
      await this._getFolders();
      if (this.collectionData.folders.length) {
        this._organizeFolders();
        console.log(this.collectionData.folders)
      }
    } else {
      if (Object.keys(storedMusicLibraryData)?.length) {
        this.collectionData = storedMusicLibraryData;
        this.requesting = false;
        console.log("Data loaded from storage");
        if (this.collectionData.folders.length) {
          this._organizeFolders();
          console.log(this.collectionData.folders);
          this.originalFolder = this.collectionData.folders.find(folder => folder.contents.length);
          this.selectedFolder = this.originalFolder;
        }
      } else {
        this.requestFailed = true;
      }
    }
  }

  _clearGrid = () => {
    this.dataReady = false;
    for (const folder of this.collectionData.folders) {
      this._setFolderId(folder.handle, '');
    }
    window.localStorage?.removeItem('music_library_data');
  }

  _getFolders = async () => {
    try {
      const foldersResponse = await fetch(this.cloudUrl, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({
          requestType: 'folders',
          token: this.$userConfig.authToken,
          tokenSecret: this.$userConfig.authTokenSecret,
          username: this.username,
        }),
      });
      if (foldersResponse) {
        this.collectionData = await foldersResponse.json();
        this.requestUpdate();
        this.renderRoot.querySelector('wa-tab-group')?.setAttribute('active', folderName);
        console.log("Data loaded from API");
        // Store data in localStorage with 7d expiry
        setLocalStorageWithExpiry(
          'music_library_data',
          JSON.stringify(this.collectionData),
          604800000
        );
        this.requesting = false;
      }
    } catch(error) {
      console.warn('Could not retrieve folder contents.');
      console.log(error.message);
      this.requestFailed = true;
      this.requesting = false;
    }
  }

  _organizeFolders = () => {
    for (const folder of this.collectionData.folders) {
      const mappedFolderContents = this._mapItemData(folder.contents);
      folder.contents = mappedFolderContents;
    }
    this.dataReady = true;
  }

  _mapItemData(data) {
    return data?.map((release) => {
      let artist = release.basic_information.artists[0].name
      if (artist.startsWith(`'`)) {
        artist = artist.replace(`'`, "");
      } else if (artist.startsWith(`"`)) {
        artist = artist.replaceAll(`"`, "");
      } else {
        artist = artist;
      }
      if (artist.endsWith(')')) {
        artist = artist.split('(')[0];
      }
      if (artist.startsWith('The ')) {
        artist = `${artist.replace('The ', '')}, The`;
      }

      return {
        artist: artist,
        date_added: release.date_added,
        genres: release.basic_information.genres,
        id: release.id,
        image_cover: release.basic_information.cover_image,
        image_thumbnail: release.basic_information.thumb,
        rating: release.rating, // returns 0 if not rated
        styles: release.basic_information.styles,
        title: release.basic_information.title,
        year: release.basic_information.year,
        year_added: release.date_added.split('-')[0],
      }
    });
  }

  _sortByArtist(folder) {
    let artists = [];
    for (const record of folder.contents) {
      artists.push(record.artist);
    }
    if (artists.length) {
      artists = artists.sort();
    }
    return [...new Set(artists)];
  }

  _searchList = debounce((query) => {
    const queryLowerCased = query.toLowerCase();
    const filteredContents = this.selectedFolder.contents.filter(
      (record) => {
        const artistLowerCased = record?.artist?.toLowerCase();
        const titleLowerCased = record?.title?.toLowerCase();
        return artistLowerCased.includes(queryLowerCased) || titleLowerCased.includes(queryLowerCased);
      }
    );
    this.filteredFolder = { ...this.selectedFolder, contents: filteredContents };
  }, 800)

  _pickRandom = () => {
    this._handleReset()
    const randomIndex = Math.floor(
      Math.random() * this.selectedFolder.contents.length
    );
    const filteredContents = this.selectedFolder.contents[randomIndex];
    this.filteredFolder = { ...this.selectedFolder, contents: [filteredContents] };
  }

  _handleTabClick = (clickedFolder) => {
    this._handleReset()
    this.originalFolder = clickedFolder;
    this.selectedFolder = clickedFolder;
  }

  _handleReset = () => {
    this.searchQuery = '';
    this.filteredFolder = {};
    this.selectedFolder = this.originalFolder;
  }

  _renderCards(list) {
    return html`
      ${repeat(
        this._sortByArtist(list),
        artist => artist,
        artist => html`
          ${repeat(
            list.contents.filter(
              record => record.artist === artist
            ).sort((a, b) => a.year - b.year),
            record => record.id,
            record => html`
              <li>
                <music-card .record=${record}></music-card>
              </li>
            `
          )}
        `
      )}
    `
  }

  _renderRecent() {
    const recents = this.selectedFolder?.contents?.filter(
      record => record.year_added > this.currentDate.getFullYear() - 1
    )?.sort((a, b) => {
      const aDate = new Date(a.date_added);
      const bDate = new Date(b.date_added);
      return bDate - aDate;
    });

    return html`
      <section>
        <h2>Recent Additions</h2>
        ${when(
          this.dataReady,
          () => html`
            ${when(
              recents?.length,
              () => html`
                <ul class="list list--horizontal flex">
                  ${repeat(
                    recents,
                    record => record.id,
                    record => html`<li><music-card .record=${record}></music-card></li>`
                  )}
                </ul>
              `,
              () => html`
                <div>No items have been added in the last 12 months.</div>
              `
            )}
          `,
          () => nothing
        )}
      </section>
    `;
  }

  _renderListActions() {
    return html`
      <div class="list-actions">
        <wa-input
          class="list-actions__search"
          label="Search by artist or album title"
          pill
          type="search"
          .value=${this.searchQuery}
          with-clear
          @input=${(e) => {
            this.searchQuery = e.target.value
            this._searchList(e.target.value)
          }}
          @wa-clear=${this._handleReset}
        ></wa-input>
        <div class="flex">
          <wa-button
            class="list-actions__random"
            @click=${this._pickRandom}
          >
            Roll them dice
          </wa-button>
          <wa-button
            class="list-actions__reset"
            @click=${this._handleReset}
          >
            Reset
          </wa-button>
        </div>
      </div>
    `
  }

  _renderList() {
    return html`
      <section>
        <h2>All Albums</h2>
        ${when(
          this.dataReady,
          () => html`
            ${this._renderListActions()}
            ${when(
              this.selectedFolder?.contents?.length,
              () => html`
                <ul class="list list--grid flex">
                  ${when(
                    Object.keys(this.filteredFolder)?.length,
                    () => this._renderCards(this.filteredFolder),
                    () => this._renderCards(this.selectedFolder)
                  )}
                </ul>
              `,
              () => html`
                <div>There are no matching records.</div>
              `
            )}
          `,
          () => nothing
        )}
      </section>
    `;
  }

  render() {
    return html`
      ${when(
        this.collectionData.folders.some(folder => folder.contents.length),
        () => html`
          <wa-tab-group>
            ${repeat(
              this.collectionData.folders,
              folder => folder.name,
              (folder, index) => html`
                <wa-tab
                  slot="nav"
                  panel="${folder.name}"
                  class=${classMap({
                    'hidden': !folder.contents.length,
                  })}
                  @click=${() => this._handleTabClick(folder)}
                >
                  ${folder.name.toUpperCase()}
                </wa-tab>
              `
            )}
            ${repeat(
              this.collectionData.folders,
              folder => folder.name,
              (folder, index) => html`
                <wa-tab-panel
                  name="${folder.name}"
                  class=${classMap({
                    'hidden': !folder.contents.length,
                  })}
                >
                  ${this._renderRecent()}
                  ${this._renderList()}
                </wa-tab-panel>
              `
            )}
          </wa-tab-group>
        `,
        () => html`
          <div class="setup-instructions">
            <ol>
              <li>In your Discogs collection, organize your items into folders by format (e.g. "Vinyl", "CD").</li>
              <li>Go in to each folder and note the folder ID in the browser address bar.<br>
                You want the number after <code>?folder=</code> in the URL.
              </li>
              <li>Enter the IDs in the appropriate fields and click "Add" to fetch your items!</li>
            </ol>
          </div>
        `
      )}
    `;
  }

  static styles = [
    structure,
    theme,
    typography,
    utilities,
    css`
      .setup-instructions {
        max-width: 640px;
      }
      section {
        padding-bottom: var(--spacing-8);

        @media screen and (min-width: 640px) {
          padding-bottom: var(--spacing-10);
        }
      }
      .list-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-6);
        max-width: 768px;
        width: 100%;

        @media screen and (min-width: 600px) {
          flex-direction: row;
          align-items: flex-end;
        }
      }
      .list-actions__search {
        flex: 1 1 auto;
        width: 100%;

        @media screen and (min-width: 600px) {
          width: unset;
        }
      }
      .list-actions__random {
        margin-right: var(--spacing-3);
      }
      .list {
        gap: var(--spacing-4);
        list-style: none;
        margin: 0;
        padding: var(--spacing-6) 0;
      }
      .list--horizontal { 
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-top: 0;
      }
      wa-tab-group {
        --track-width: 0px;
      }
      wa-tab-group::part(active-tab-indicator) {
        display: none;
      }
      wa-tab-group::part(tabs) {
        border: none;
      }
      wa-tab {
        background-color: var(--color-sand);
        border: none;
        border-radius: var(--wa-panel-border-radius) var(--wa-panel-border-radius) 0px 0px;
        cursor: pointer;
        min-width: 140px;
      }
      wa-tab[active] {
        color: initial;
      }
      wa-tab::part(base) {
        font: var(--font-h4);
        letter-spacing: 2px;
      }
      wa-tab[id="wa-tab-1"] {
        background-color: var(--color-sand);
      }
      wa-tab[id="wa-tab-2"] {
        background-color: var(--color-scrub);
      }
      wa-tab[id="wa-tab-3"] {
        background-color: var(--color-tan);
      }
      wa-tab:not(.hidden):has(+ wa-tab.hidden) {
        box-shadow: var(--spacing-1) var(--spacing-1) 0 var(--color-dark-primary);
      }
      wa-tab-panel {
        background-color: var(--color-sand);
        border-radius: 0 var(--wa-panel-border-radius) var(--wa-panel-border-radius);
        box-shadow: var(--spacing-1) var(--spacing-1) 0 var(--color-dark-primary);
        padding: 0 var(--spacing-2);

        @media screen and (min-width: 640px) {
          padding: 0 var(--spacing-6);
        }
      }
      wa-tab-panel[id="wa-tab-panel-1"] {
        background-color: var(--color-sand);
      }
      wa-tab-panel[id="wa-tab-panel-2"] {
        background-color: var(--color-scrub);
      }
      wa-tab-panel[id="wa-tab-panel-3"] {
        background-color: var(--color-tan);
      }
      wa-tab-panel::part(base) {
        padding: var(--spacing-2);
      }
    `
  ];
}
customElements.define('music-grid', MusicGrid);