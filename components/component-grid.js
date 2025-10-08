import { LitElement, css, html, nothing, repeat, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/all/lit-all.min.js';
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
    this.music_library_data = {
      user_name: 'sojournaut',
      folders: [
        { handle: 'vinyl', id: '3827785' },
        { handle: 'cd', id: '6104421' },
      ],
    };

    // Check if we already have unexpired data
    if (window.localStorage.getItem('music_library_data')) {
      this.music_library_data = JSON.parse(getLocalStorageWithExpiry('music_library_data'));
      this.data_ready = true;
      console.log("Data loaded from storage");
      console.log(this.music_library_data)
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
      return {
        artist: release.basic_information.artists[0].name,
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
    return [...new Set(artists)];
  }

  render() {
    return html`
      <div>
        ${when(
          this.data_ready,
          () => html`
            ${repeat(
              this.music_library_data.folders,
              folder => folder.id,
              folder => html`
                <h2>${folder.handle}</h2>
                ${when(
                  folder.contents?.length,
                  () => html`
                    ${repeat(
                      this._listArtists(folder),
                      artist => artist,
                      artist => html`
                        <h3>${artist}</h3>
                        <ul>
                          ${repeat(
                            folder.contents.filter(
                              item => item.artist === artist
                            ),
                            item => item.id,
                            item => html`
                              <li>${item.title}</li>
                            `
                          )}
                        </ul>
                      `
                    )}
                  `,
                  () => nothing
                )}
              `
            )}
          `,
          () => html`
            <div>LOADING ...</div>
          `
        )}
      </div>
    `;
  }
}
customElements.define('music-grid', MusicGrid);