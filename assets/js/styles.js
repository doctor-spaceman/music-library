import { css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.3.0/core/lit-core.min.js';

export const typography = css`
  p, .p1 { font: var(--font-p-large); }  
  .p2 { font: var(--font-p); }
  .p3 { font: var(--font-p-small); }  
  .p4 { font: var(--font-p-xsmall); }

  h1, .h1 {
    font: var(--font-h1);
    margin-top: 0px;
  }
  h2, .h2 {
    color: var(--color-green);
    font: var(--font-h2);
    margin: 23px 0px 12px 0px;
  }
  h3, .h3 {
    color: var(--color-green);
    font: var(--font-h3);
    margin: 20px 0px 12px 0px; 
  }
  h4, .h4 {
    font: var(--font-h4);
  }
`;

export const theme = css`
  .c-green { color: var(--color-green); }
  .c-olive { color: var(--color-olive); }
  .c-faded-olive { color: var(--color-faded-olive); }
  .c-sage { color: var(--color-sage); }
  .c-sand { color: var(--color-sand); }
  .c-scrub { color: var(--color-scrub); }
  .c-teal { color: var(--color-teal); }
  .c-white { color: var(--color-white); }

  .bg-green { background-color: var(--color-green); }
  .bg-olive { background-color: var(--color-olive); }
  .bg-faded-olive { background-color: var(--color-faded-olive); }
  .bg-sage { background-color: var(--color-sage); }
  .bg-sand { background-color: var(--color-sand); }
  .bg-scrub { background-color: var(--color-scrub); }
  .bg-teal { background-color: var(--color-teal); }
  .bg-white { background-color: var(--color-white); }

  a {
    color: var(--color-teal);
  }
  a:hover, a:focus {
    color:var(--color-green);
  }
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