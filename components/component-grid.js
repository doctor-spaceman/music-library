import { LitElement, createRef, css, html, nothing, ref, repeat, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/all/lit-all.min.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/button/button.js'
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/tab/tab.js'
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/tab-group/tab-group.js'
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/tab-panel/tab-panel.js'
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/input/input.js'
import { structure, theme, typography } from '../assets/js/styles.js';
import { debounce, getLocalStorageWithExpiry, setLocalStorageWithExpiry } from '../assets/js/utils.js';

class MusicGrid extends LitElement {
  static properties = {
    data_ready: {
      type: Boolean,
      attribute: false,
      state: true
    },
    music_library_data: {
      type: Array,
      attribute: false,
      state: true
    },
    selected_folder: {
      type: Object,
      attribute: false,
      state: true
    }
  }

  constructor() {
    super();

    this.data_ready = false;
    // Hardcoded to avoid having to login every time and to get data specific to this profile.
    // NOTE: Without login, only public collections and folders are accessible.
    // TODO: Add an input and button to switch profiles.
    this.music_library_data = {
      user_name: 'sojournaut',
      folders: [
        { handle: 'vinyl', id: '3827785' },
        { handle: 'cd', id: '6104421' },
      ],
    };
    this.currentDate = new Date();

    // Check if we already have unexpired data
    if (window.localStorage.getItem('music_library_data')) {
      this.music_library_data = JSON.parse(getLocalStorageWithExpiry('music_library_data'));
      if (this.music_library_data) {
        this.data_ready = true;
        console.log("Data loaded from storage");
        console.log(this.music_library_data)
      }
    } else {
      this._getFolderContents();
    }

    this.original_folder = this.music_library_data.folders[0];
    this.selected_folder = this.music_library_data.folders[0];
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  async _getFolderContents() {
    let firstPage;
    let firstPageData;
    let nextPage;
    let nextPageData;
    let folderContents = [];
    const user = this.music_library_data.user_name;

    for (const [index, folder] of this.music_library_data.folders.entries()) {
      // Get first page of results
      try {
        firstPageData = await fetch(
          `https://api.discogs.com/users/${user}/collection/folders/${folder.id}/releases?page=1&per_page=100&sort=artist`
        );

        if (firstPageData) {
          firstPage = await firstPageData.json();
          folderContents = this._mapItemData(firstPage);

          // Get subsequent pages
          for (let page = 2; page <= firstPage.pagination.pages; page++) {
            nextPageData = await fetch(
              `https://api.discogs.com/users/${this.music_library_data.user_name}/collection/folders/${folder.id}/releases?page=${page}&per_page=100&sort=artist`
            );
            if (nextPageData) {
              nextPage = await nextPageData.json();
              folderContents = [...folderContents, ...this._mapItemData(nextPage)];
            }
          }

          this.music_library_data.folders[index].contents = folderContents;

          if (index === this.music_library_data.folders.length - 1) {
            this.data_ready = true;
            console.log("Data loaded from API");
            console.log(this.music_library_data)
            // Store data in localStorage with 14d expiry
            setLocalStorageWithExpiry(
              'music_library_data',
              JSON.stringify(this.music_library_data),
              1209600000
            );
          }
        }
      } catch(error) {
        console.error('Error fetching data:', error);
      }
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
        rating: release.rating,
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
    this.original_folder = structuredClone(this.selected_folder);
    const filteredContents = this.selected_folder.contents.filter(
      (record) => record.artist.toLowerCase().includes(query) || record.title.toLowerCase().includes(query)
    );
    this.selected_folder = { ...this.selected_folder, contents: filteredContents };
  }, 800)

  _pickRandom() {
    this._resetList();
    const randomResult = this.selected_folder.contents[
      Math.floor(
        Math.random() * this.selected_folder.contents.length
      )
    ];
    this.selected_folder = { ...this.selected_folder, contents: [randomResult] };
  }

  _resetList() {
    this.selected_folder = this.original_folder;
  }

  _resetInput(event) {
    event.target.closest('.list-actions').querySelector('.list-actions__search').value = '';
  }

  _renderRecent(index) {
    const selectedFolder = this.music_library_data.folders[index];
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
          this.data_ready,
          () => html`
            ${when(
              selectedFolderContents?.length,
              () => html`
                <ul class="list list--horizontal flex">
                  ${repeat(
                    selectedFolderContents,
                    record => record.id,
                    record => html`<music-card .record=${record}></music-card>`
                  )}
                </ul>
              `,
              () => html`
                <div>No items have been added in the last 12 months.</div>
              `
            )}
          `,
          () => html`
            <div>
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
      <div class="list-actions flex">
        <sl-input
          class="list-actions__search"
          label="Search by artist or album title"
          clearable
          pill
          @sl-input=${(e) => this._searchList(e.target.value)}
          @sl-clear=${() => this.selected_folder = this.original_folder}
        ></sl-input>
        <sl-button
          class="list-actions__random"
          @click=${this._pickRandom}
        >
          Roll them dice
        </sl-button>
        <sl-button
          class="list-actions__reset"
          @click=${(e) => {
            this._resetList()
            this._resetInput(e)
          }}
        >
          Reset
        </sl-button>
      </div>
    `
  }

  _renderList() {
    return html`
      <section>
        <h2>All Albums</h2>
        ${when(
          this.data_ready,
          () => html`
            ${this._renderListActions()}
            ${when(
              this.selected_folder?.contents?.length,
              () => html`
                <ul class="list list--grid flex">
                  ${repeat(
                    this._sortByArtist(this.selected_folder),
                    artist => artist,
                    artist => html`
                      ${repeat(
                        this.selected_folder.contents.filter(
                          record => record.artist === artist
                        ).sort((a, b) => a.year - b.year),
                        record => record.id,
                        record => html`<music-card .record=${record}></music-card>`
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
            <div class="flex flex-column">
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
        this.music_library_data.folders.length > 1,
        () => html`
          <sl-tab-group>
            ${repeat(
              this.music_library_data.folders,
              folder => folder.id,
              (folder, index) => html`
                <sl-tab
                  slot="nav"
                  panel="${folder.handle}"
                  @click=${() => {
                    this.original_folder = folder
                    this.selected_folder = folder
                  }}
                >
                  ${folder.handle.toUpperCase()}
                </sl-tab>
              `
            )}
            ${repeat(
              this.music_library_data.folders,
              folder => folder.id,
              (folder, index) => html`
                <sl-tab-panel
                  name="${folder.handle}"
                >
                  ${this._renderRecent(index)}
                  ${this._renderList()}
                </sl-tab-panel>
              `
            )}
          </sl-tab-group>
        `,
        () => html`
          ${this._renderRecent(0)}
          ${this._renderList()}
        `
      )}
    `;
  }

  static styles = [
    structure,
    theme,
    typography,
    css`
      section {
        padding-bottom: var(--spacing-20);
      }

      .list-actions {
        align-items: flex-end;
        gap: var(--spacing-6);
        width: 100%;
      }

      .list-actions__search {
        flex: 1 1 auto;
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
      }
      
      .list--grid {
        li {
          margin-bottom: var(--spacing-6);
        }
      }

      sl-tab-group {
        --track-width: 0px;
      }
      sl-tab-group::part(active-tab-indicator) {
        display: none;
      }
      sl-tab-group::part(tabs) {
        repeat(2, 1fr);
      }
      sl-tab {
        border: 1px solid var(--color-dark-primary);
        border-radius: var(--spacing-2) var(--spacing-2) 0px 0px;
        cursor: pointer;
        min-width: 140px;
      }
      sl-tab[active] {
        border-bottom: none;
      }
      sl-tab:not([active]) {
        border-top: none;
        border-right: none;
        border-left: none;
      }
      sl-tab-panel {
        padding: 0 var(--spacing-6);
      }
    `
  ];
}
customElements.define('music-grid', MusicGrid);