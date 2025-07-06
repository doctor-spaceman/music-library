import { LitElement, css, html, nothing, repeat, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/all/lit-all.min.js';
import { structure, theme, typography } from '../assets/js/styles.js';
import { isMobile, getLocalStorageWithExpiry, setLocalStorageWithExpiry } from '../assets/js/utils.js';

class MusicGrid extends LitElement {
  static properties = {
    
  }

  constructor() {
    super();

    // Hardcoded to avoid having to login every time. As a result, 
    // this only works with public collections and folders.
    this.profile = {
      user_name: 'sojournaut',
      folders: [
        { handle: 'vinyl', id: '3827785' },
        { handle: 'cd', id: '6104421' },
      ],
    }

    for (const folder of this.profile.folders) {
      this._getFolderContents(this.profile.user_name, folder.id);
    }
    document.addEventListener('music-library:data-ready', (event) => {
      const folderToUpdate = this.profile.folders.find(
        (folder) => folder.id === event.detail.folder
      );
      const indexToUpdate = this.profile.folders.indexOf(folderToUpdate);
      this.profile.folders[indexToUpdate] = event.detail.contents;
    });
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

    for (let page = 2; page <= firstPage.pagination.pages; page++) {
      await fetch(
        `https://api.discogs.com/users/${this.profile.user_name}/collection/folders/${folderId}/releases?page=${page}&per_page=100&sort=artist`
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
    
    document.dispatchEvent(new CustomEvent('music-library:data-ready', {
      detail: {
        folder: folderId,
        contents: folderContents,
      }
    }));
  }

  _mapItemData(data) {
    return data?.releases?.map((release) => {
      return {
        image_thumbnail: release.basic_information.thumb,
        image_cover: release.basic_information.cover_image,
        title: release.basic_information.title,
        year: release.basic_information.year,
        artist: release.basic_information.artists[0].name,
        genres: release.basic_information.genres,
        styles: release.basic_information.styles,
      }
    });
  }

  render() {
    return html`
      <div></div>
    `;
  }
}
customElements.define('music-grid', MusicGrid);