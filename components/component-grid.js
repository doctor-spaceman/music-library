import { LitElement, css, html, nothing, repeat, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/all/lit-all.min.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/accordion/accordion.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/button/button.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/input/input.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/tab/tab.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/tab-group/tab-group.js';
import 'https://ka-f.webawesome.com/webawesome@3.14.0/components/tab-panel/tab-panel.js';
import { structure, theme, typography } from '../assets/js/styles.js';
import { debounce, getLocalStorageWithExpiry, setLocalStorageWithExpiry } from '../assets/js/utils.js';

class MusicGrid extends LitElement {
  static properties = {
    dataReady: {
      type: Boolean,
      state: true
    },
    collectionData: {
      type: Object,
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
    username: {
      type: String,
      state: true
    },
    selectedFolder: {
      type: Object,
      state: true
    }
  }

  constructor() {
    super();

    this.dataReady = false;
    this.cdFolderId = '';
    this.tapeFolderId = '';
    this.vinylFolderId = '';
    this.collectionData = {
      folders: [
        {
          'handle': 'vinyl',
          'id': this.vinylFolderId, 
          'contents': []
        },
        {
          'handle': 'cd',
          'id': this.cdFolderId, 
          'contents': []
        },
        {
          'handle': 'tape',
          'id': this.tapeFolderId, 
          'contents': []
        }
      ]
    };
    this.username = getLocalStorageWithExpiry('music_library_user') || '';
    if (this.username.length) {
      this._setupGrid();
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.$collectionConfig = document.querySelector('music-user-config');
    this.$collectionConfig.addEventListener('music-library:folder-id-added', (event) => {
      console.log(event);
      this._setFolderId(event.detail?.folderName, event.detail?.folderId);
      this._getFolderContents(event.detail?.folderId);
    });
    this.$collectionConfig.addEventListener('music-library:folder-id-cleared', (event) => {
      console.log(`Clear request received for ${event.detail?.folderName} ${event.detail?.folderId}`)
      this._setFolderId(event.detail?.folderName, event.detail?.folderId);
    });

    console.log('Username from grid:', this.username)
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  updated(changedProperties) {
    if (changedProperties.has('user')) {
      console.log(`User: ${this.username}`);
      if (this.username?.length) {
        this._setupGrid();
      } else {
        this._clearGrid();
      }
    }
  }

  _setupGrid = async () => {
    // Check if we already have unexpired data
    this.currentDate = new Date();
    const musicLibraryData = getLocalStorageWithExpiry('music_library_data');
    if (!musicLibraryData) {
      return
    }

    if (Object.keys(musicLibraryData)?.length) {
      this.dataReady = true;
      this.collectionData = musicLibraryData;
      console.log("Data loaded from storage");
      if (Object.keys(this.collectionData).length) {
        console.log(this.collectionData.folders);
        this.originalFolder = this.collectionData.folders[0];
        this.selectedFolder = this.collectionData.folders[0];
        if (this.$collectionConfig) {
          this._setFolderId('cd', this.collectionData.folders.find(folder => folder.handle === 'cd').id);
          this._setFolderId('tape', this.collectionData.folders.find(folder => folder.handle === 'tape').id);
          this._setFolderId('vinyl', this.collectionData.folders.find(folder => folder.handle === 'vinyl').id);
          this.$collectionConfig.cdFolderId = this.cdFolderId;
          this.$collectionConfig.tapeFolderId = this.tapeFolderId;
          this.$collectionConfig.vinylFolderId = this.vinylFolderId;
        }
      }
    } else {
      //this._getFolderContents();
    }
  }

  _clearGrid = () => {
    this.dataReady = false;
    window.localStorage?.removeItem('music_library_data');
    window.localStorage?.removeItem('music_library_user');
  }

  _setFolderId = (folderName, folderId) => {
    console.log(`${folderName} ID was set:`, folderId);
    const folder = this.collectionData.folders.find(folder => folder.handle === folderName);
    if (folder) {
      folder.id = folderId;
    }

    switch(folderName) {
      case 'cd':
        this.cdFolderId = folderId;
        break;
      case 'tape':
        this.tapeFolderId = folderId;
        break;
      case 'vinyl':
        this.vinylFolderId = folderId;
        break;
    }
  }

  _getFolderContents = async (id) => {
    let firstPage;
    let firstPageData;
    let nextPage;
    let nextPageData;
    let folderContents = [];

    // Get first page of results
    try {
      if (id) {
        firstPageData = await fetch(
          `https://api.discogs.com/users/${this.username}/collection/folders/${id}/releases?page=1&per_page=100&sort=artist`
        );
      }

      if (firstPageData) {
        firstPage = await firstPageData.json();
        folderContents = this._mapItemData(firstPage);

        // Get subsequent pages
        for (let page = 2; page <= firstPage.pagination.pages; page++) {
          nextPageData = await fetch(
            `https://api.discogs.com/users/${this.username}/collection/folders/${id}/releases?page=${page}&per_page=100&sort=artist`
          );
          if (nextPageData) {
            nextPage = await nextPageData.json();
            folderContents = [...folderContents, ...this._mapItemData(nextPage)];
          }
        }

        this.collectionData.folders.find(folder => folder.id === id).contents = folderContents;
        this.dataReady = true;
        this.originalFolder = this.collectionData.folders[0];
        this.selectedFolder = this.collectionData.folders[0];
        this.requestUpdate();
        console.log("Data loaded from API");
        console.log(this.collectionData)
        // Store data in localStorage with 7d expiry
        setLocalStorageWithExpiry(
          'music_library_data',
          JSON.stringify(this.collectionData),
          604800000
        );
      }
    } catch(error) {
      console.error(`Error fetching folder contents`, error);
    }
  }

  _mapItemData(data) {
    return data?.releases?.map((release) => {
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
    this._resetList();
    this.originalFolder = structuredClone(this.selectedFolder);
    
    const queryLowerCased = query.toLowerCase();
    const filteredContents = this.selectedFolder.contents.filter(
      (record) => {
        const artistLowerCased = record?.artist?.toLowerCase();
        const titleLowerCased = record?.title?.toLowerCase();
        return artistLowerCased.includes(queryLowerCased) || titleLowerCased.includes(queryLowerCased);
      }
    );
    this.selectedFolder = { ...this.selectedFolder, contents: filteredContents };
  }, 800)

  _pickRandom() {
    this._resetList();
    const randomResult = this.selectedFolder.contents[
      Math.floor(
        Math.random() * this.selectedFolder.contents.length
      )
    ];
    this.selectedFolder = { ...this.selectedFolder, contents: [randomResult] };
  }

  _resetList() {
    this.selectedFolder = this.originalFolder;
  }

  _resetInput(event) {
    event.target.closest('.list-actions').querySelector('.list-actions__search').value = '';
  }

  _renderRecent(index) {
    const selectedFolder = this.collectionData?.folders?.[index];
    const selectedFolderContents = selectedFolder?.contents?.filter(
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
              selectedFolderContents?.length,
              () => html`
                <ul class="list list--horizontal flex">
                  ${repeat(
                    selectedFolderContents,
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
          () => html`
            <div class="loading">
              <img width="80" src="./assets/img/record-player-pixel-art.gif" alt="Graphic of a turntable with a spinning record" />
              <p>LOADING ...</p>
            </div>
          `
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
          clearable
          pill
          @input=${(e) => this._searchList(e.target.value)}
          @wa-clear=${() => this.selectedFolder = this.originalFolder}
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
            @click=${(e) => {
              this._resetList()
              this._resetInput(e)
            }}
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
                  ${repeat(
                    this._sortByArtist(this.selectedFolder),
                    artist => artist,
                    artist => html`
                      ${repeat(
                        this.selectedFolder.contents.filter(
                          record => record.artist === artist
                        ).sort((a, b) => a.year - b.year),
                        record => record.id,
                        record => html`<li><music-card .record=${record}></music-card></li>`
                      )}
                    `
                  )}
                </ul>
              `,
              () => html`
                <div>There are no matching records.</div>
              `
            )}
          `,
          () => html`
            <div class="loading">
              <img width="80" src="./assets/img/record-player-pixel-art.gif" alt="Graphic of a turntable with a spinning record" />
              <p>LOADING ...</p>
            </div>
          `
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
              folder => folder.id,
              (folder, index) => html`
                ${when(
                  folder.contents?.length,
                  () => html`
                    <wa-tab
                      slot="nav"
                      panel="${folder.handle}"
                      @click=${() => {
                        this.originalFolder = folder
                        this.selectedFolder = folder
                      }}
                    >
                      ${folder.handle.toUpperCase()}
                    </wa-tab>
                  `,
                  () => nothing
                )}
              `
            )}
            ${repeat(
              this.collectionData.folders,
              folder => folder.id,
              (folder, index) => html`
                ${when(
                  folder.contents?.length,
                  () => html`
                    ${when(
                      folder.contents?.length,
                      () => html`
                        <wa-tab-panel
                          name="${folder.handle}"
                        >
                          ${this._renderRecent(index)}
                          ${this._renderList()}
                        </wa-tab-panel>
                      `,
                      () => nothing
                    )}
                  `
                )}
              `
            )}
          </wa-tab-group>
        `,
        () => nothing // TODO: show instructions for adding folders
      )}
    `;
  }

  static styles = [
    structure,
    theme,
    typography,
    css`
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
        repeat(2, 1fr);
      }
      wa-tab {
        background-color: var(--color-sand);
        border-radius: var(--spacing-2) var(--spacing-2) 0px 0px;
        cursor: pointer;
        min-width: 140px;
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
      wa-tab-panel {
        background-color: var(--color-sand);
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
      wa-tab-panel::part(base) {
        padding: var(--spacing-2);
      }
    `
  ];
}
customElements.define('music-grid', MusicGrid);