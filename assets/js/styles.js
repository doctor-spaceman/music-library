import { css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/core/lit-core.min.js';

export const typography = css`
  body {
    background-color: var(--color-sand);
    color: var(--color-dark-primary);
    font: var(--font-p-large);
  }
  p, .p1 {
    font: var(--font-p-large);
  }
  .p2 {
    font: var(--font-p);
  }
  .p3 {
    font: var(--font-p-small);
  }
  .p4 {
    font: var(--font-p-xsmall);
  }
  h1, .h1 {
    font: var(--font-h1);
    margin-top: 0px;
  }
  h2, .h2 {
    font: var(--font-h2);
    margin: var(--spacing-3) 0;
  }
  h3, .h3 {
    font: var(--font-h3);
    margin: 0; 
  }
  h4, .h4 {
    font: var(--font-h4);
    margin: 0; 
  }
`;

export const theme = css`

`

export const structure = css`
  .flex {
    display: flex;
    flex-wrap: wrap;
  }
  .flex-column {
    flex-direction: column;
  }
  .flex-center {
    align-items: center;
    justify-content: flex-start;
  }
  .flex-justify-space-between {
    justify-content: space-between;
  }
  .flex-nowrap {
    flex-wrap: nowrap;
  }
  .grid {
    display: grid;
  }
`

export const utilities = css`
  .sr-only {
    position: absolute; 
    overflow: hidden; 
    clip: rect(0 0 0 0); 
    height: 1px; 
    width: 1px; 
    margin: -1px; 
    padding: 0; 
    border: 0;
  }
`