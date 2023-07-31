const express = require('express');
const app = express();

app.get('/', (req, res) => {
  console.log('Hello world received a request.');

  const image = process.env.IMAGE;
  const imagestream = image.split("@")[0]
  const sha256 = image.split("@")[1]
  res.send(`<h4>Hello OpenShift Serverless: Serving!</h4><p><small>serving: ${imagestream}</small></p><p><small>${sha256}</small></p>`);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Hello world listening on port', port);
});
