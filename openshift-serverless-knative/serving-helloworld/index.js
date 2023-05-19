const express = require('express');
const app = express();

app.get('/', (req, res) => {
  console.log('Hello world received a request.');

  const image = process.env.IMAGE;
  res.send(`<h4>Hello World!</h4><small>serving: ${image}</small>`);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Hello world listening on port', port);
});
