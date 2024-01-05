

const st = `
.svg-icon {
  width: 1em;
  height: 1em;
}

.svg-icon path,
.svg-icon polygon,
.svg-icon rect {
  fill: #4691f6;
}

.svg-icon circle {
  stroke: #4691f6;
  stroke-width: 1;
}
`


export default ({ title, children }, helpers) => (
    <html>
      <head>
        <title>{title}</title>
        <script type="module" src={helpers.url("/src/main.js")} bundle="true"></script>        
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css"></link>
        <style>{st}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  )