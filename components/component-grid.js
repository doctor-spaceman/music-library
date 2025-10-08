import { LitElement, css, html, nothing, repeat, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/all/lit-all.min.js';
import { structure, theme, typography } from '../assets/js/styles.js';
import { isMobile, getLocalStorageWithExpiry, setLocalStorageWithExpiry } from '../assets/js/utils.js';

class MusicGrid extends LitElement {
  static properties = {
    music_library_data: { type: Array },
  }

  constructor() {
    super();

    // Check if we already have unexpired data
    this.music_library_data = getLocalStorageWithExpiry('music_library_data') || null;

    // If no unexpired data, make new request(s)
    if (!this.music_library_data) {
      // Hardcoded to avoid having to login every time and to get data specific to this profile.
      // NOTE: Without login, only public collections and folders are accessible.
      this.music_library_data = {
        user_name: 'sojournaut',
        folders: [
          { handle: 'vinyl', id: '3827785' },
          { handle: 'cd', id: '6104421' },
        ],
      };
      for (const folder of this.music_library_data.folders) {
        this._getFolderContents(this.music_library_data.user_name, folder.id);
      }
    }

    console.log(this.music_library_data)
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  async _getFolderContents(user, folderId) {
    let firstPage;
    let nextPage;
    let folderContents = [];

    // Get first page of results
    await fetch(
      `https://api.discogs.com/users/${user}/collection/folders/${folderId}/releases?page=1&per_page=100&sort=artist`
    ).then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      firstPage = data;
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
    folderContents = this._mapItemData(firstPage);

    // Get subsequent pages
    for (let page = 2; page <= firstPage.pagination.pages; page++) {
      await fetch(
        `https://api.discogs.com/users/${this.music_library_data.user_name}/collection/folders/${folderId}/releases?page=${page}&per_page=100&sort=artist`
      ).then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        nextPage = this._mapItemData(data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
      folderContents = [...folderContents, ...nextPage];
    }

    const folderToUpdate = this.music_library_data.folders.find(
      (folder) => folder.id === folderId
    );
    const indexToUpdate = this.music_library_data.folders.indexOf(folderToUpdate);
    this.music_library_data.folders[indexToUpdate].contents = folderContents;

    // Store data in localStorage with 14d expiry
    setLocalStorageWithExpiry('music_library_data', this.music_library_data, 1209600000)
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

  render() {
    return html`
      <div>
        ${repeat(
          this.music_library_data.folders,
          (folder) => folder.id,
          (folder) => html`
            <h2>${folder.handle}</h2>
            ${repeat(
              folder.contents,
              (record) => record.id,
              (record) => html`
                <h3>${record.artist}</h3>
                <ul>
                  ${repeat(
                    folder.contents.filter(item => item.artist === record.artist),
                    (item) => item.id,
                    (item) => html`
                      <li>${item.title}</li>
                    `
                  )}
                </ul>
              `
            )}
          `
        )}
      </div>
    `;
  }
}
customElements.define('music-grid', MusicGrid);