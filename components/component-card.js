import { LitElement, css, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/all/lit-all.min.js';

class MusicCard extends LitElement {
  static properties = {
    record: {
      type: Object,
      attribute: 'record'
    }
  }

  constructor() {
    super();
  }

  render() {
    return html`
      <li class="record">
        <img
          src="${this.record.image_cover}"
          loading="lazy"
          class="record__thumbnail"
        />
        <h3 class="record__title">${this.record.title}</h3>
        <p class="record__artist">${this.record.artist}</p>
        <p class="record__release-year">${this.record.year}</p>
        <p class="record__genres">${this.record.genres.join(', ')}</p>
      </li>
    `
  }

  static styles = [
    css`
      :host {
        background-color: var(--color-light-primary);
        border: 1px solid var(--color-light-gray);
        box-shadow: 
          0px 1px 0 var(--color-dark-primary),
          1px 0px 0 var(--color-dark-primary),
          1px 2px 0 var(--color-dark-primary),
          2px 1px 0 var(--color-dark-primary),
          2px 3px 0 var(--color-dark-primary),
          3px 2px 0 var(--color-dark-primary),
          3px 4px 0 var(--color-dark-primary),
          4px 3px 0 var(--color-dark-primary),
          4px 5px 0 var(--color-dark-primary),
          5px 4px 0 var(--color-dark-primary);
      }
      .record {
        flex: 0 0 auto;
        width: 120px;
        padding: var(--spacing-2);

        @media screen and (min-width: 566px) {
          width: 140px;
        }
        @media screen and (min-width: 768px) {
          width: 200px;
        }
      }
      .record__thumbnail {
        aspect-ratio: 1;
        display: block;
        width: 100%;
      }
      .record__title {
        margin-top: var(--spacing-2);
        margin-bottom: var(--spacing-2);
      }
      .record__artist,
      .record__release-year {
        margin: 0;
        margin-bottom: var(--spacing);
      }
      .record__genres {
        color: var(--color-light-gray);
        font: var(--font-p-small);
        margin-bottom: 0;
      }
    `
  ];
}
customElements.define('music-card', MusicCard);