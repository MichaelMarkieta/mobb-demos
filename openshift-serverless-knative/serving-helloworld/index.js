const express = require('express');
const app = express();

app.get('/', (req, res) => {
  console.log('Hello world received a request.');

  const image = process.env.IMAGE;
  const imagestream = image.split("@")[0]
  const sha256 = image.split("@")[1]
  res.send(`<html><body style="background: #0075be; padding: 30px;"><main style="height: 500px; width: 80%; margin: 0 auto; padding: 20px; display: flex; justify-content: center; align-items: center; resize: both; overflow: auto;"><div style="color: #f47920; width: 80%; padding: 20px; resize: both; overflow: auto;"><h4>Hello OpenShift Serverless: Serving!</h4><p><small>serving: ${imagestream}</small></p><p><small>${sha256}</small></p></div></main></body></html>`);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Hello world listening on port', port);
});
