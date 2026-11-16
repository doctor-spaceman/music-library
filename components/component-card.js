import { LitElement, css, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/all/lit-all.min.js';
import { structure, typography } from '../assets/js/styles.js';

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
      <div class="record flex flex-column flex-justify-space-between">
        <div>
          <img
            src="${this.record.image_cover}"
            loading="lazy"
            class="record__thumbnail"
          />
          <p class="p3 record__artist">${this.record.artist}</p>
          <h3 class="h4 record__title">${this.record.title}</h3>
        </div>
        <p class="p3 record__release-year">${this.record.year}</p>
      </div>
    `
  }

  static styles = [
    structure,
    typography,
    css`
      :host {
        display: block;
        height: 100%;
      }

      .record {
        flex: 0 0 auto;
        background-color: var(--color-light-primary);
        border: 1px solid var(--color-gray);
        box-sizing: border-box;
        height: 100%;
        padding: var(--spacing-2);
        width: 160px;

        @media screen and (min-width: 768px) {
          width: 200px;
        }
      }
      .record__thumbnail {
        aspect-ratio: 1;
        background-color: var(--color-gray);
        display: block;
        width: calc(160px - calc(var(--spacing-2) * 2));

        @media screen and (min-width: 768px) {
          width: calc(200px - calc(var(--spacing-2) * 2));
        }
      }
      .record__title {
        margin: var(--spacing-2) 0;
      }
      .record__artist {
        margin: var(--spacing-1) 0;
      }
      .record__release-year {
        align-self: flex-end;
        color: var(--color-gray);
        margin: 0;
      }
    `
  ];
}
customElements.define('music-card', MusicCard);