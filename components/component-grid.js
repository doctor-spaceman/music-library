import { LitElement, css, html, nothing, repeat, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/all/lit-all.min.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/tab/tab.js'
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/tab-group/tab-group.js'
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/components/tab-panel/tab-panel.js'
import { structure, theme, typography } from '../assets/js/styles.js';
import { isMobile, getLocalStorageWithExpiry, setLocalStorageWithExpiry } from '../assets/js/utils.js';

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
          console.log(firstPage);
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

  _listArtists(folder) {
    let artists = [];
    for (const record of folder.contents) {
      artists.push(record.artist);
    }
    if (artists.length) {
      artists = artists.sort();
    }
    return [...new Set(artists)];
  }

  _renderList(index) {
    const selectedFolder = this.music_library_data.folders[index];
    return html`
      <section>
        <h2>All Albums</h2>
        ${when(
          this.data_ready && selectedFolder?.contents?.length,
          () => html`
            <ul class="full-list flex">
              ${repeat(
                this._listArtists(selectedFolder),
                artist => artist,
                artist => html`
                  ${repeat(
                    selectedFolder.contents.filter(
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
            </ul>
          `,
          () => html`
            <div>LOADING ...</div>
          `
        )}
      </section>
    `;
  }

  _renderRecent(index) {
    const selectedFolder = this.music_library_data.folders[index];
    return html`
      <section>
        <h2>Recently Added</h2>
        ${when(
          this.data_ready && selectedFolder?.contents?.length,
          () => html`
            <ul class="recently-added flex">
              ${repeat(
                selectedFolder.contents.filter(
                  record => record.year_added > this.currentDate.getFullYear() - 1
                ).sort((a, b) => {
                  const aDate = new Date(a.date_added);
                  const bDate = new Date(b.date_added);
                  return bDate - aDate
                }),
                record => record.id,
                record => html`
                  <li>
                    <music-card .record=${record}></music-card>
                  </li>`
              )}
            </ul>
          `,
          () => html`
            <div>LOADING ...</div>
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
                  ?active=${index === 0}
                  panel="${folder.handle}"
                >
                  ${folder.handle}
                </sl-tab>
              `
            )}
            ${repeat(
              this.music_library_data.folders,
              folder => folder.id,
              (folder, index) => html`
                <sl-tab-panel
                  ?active=${index === 0}
                  name="${folder.handle}"
                >
                  ${this._renderRecent(index)}
                  ${this._renderList(index)}
                </sl-tab-panel>
              `
            )}
          </sl-tab-group>
        `,
        () => html`
          ${this._renderRecent(0)}
          ${this._renderList(0)}
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
      .recently-added,
      .full-list {
        gap: var(--spacing-4);
        list-style: none;
        margin: 0;
        padding: var(--spacing-6) 0;

        li {
          flex: 0 0 auto;
          width: 140px;

          @media screen and (min-width: 768px) {
            width: 200px;
          }
        }
      }
      
      .recently-added {
        flex-wrap: nowrap;
        overflow-x: auto;
      }
      
      .full-list {
        li {
          margin-bottom: var(--spacing-6);
        }
      }
    `
  ];
}
customElements.define('music-grid', MusicGrid);