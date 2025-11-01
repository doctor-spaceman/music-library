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
          <p class="record__artist">${this.record.artist}</p>
          <h3 class="record__title">${this.record.title}</h3>
        </div>
        <p class="record__release-year">${this.record.year}</p>
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
        border: 1px solid var(--color-light-gray);
        box-sizing: border-box;
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
        height: 100%;
        width: 160px;
        padding: var(--spacing-2);

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
        margin: var(--spacing-2) 0;
      }
      .record__artist {
        margin: var(--spacing) 0;
      }
      .record__release-year {
        align-self: flex-end;
        color: var(--color-light-gray);
        font: var(--font-p-small);
        margin: 0;
      }
    `
  ];
}
customElements.define('music-card', MusicCard);