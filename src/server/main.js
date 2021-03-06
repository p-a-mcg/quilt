const express = require("express");
const fetch = require("node-fetch");
const ogs = require("open-graph-scraper");

const app = express();

if (process.env.NODE_ENV === "development") {
  const webpack = require("webpack");
  const compiler = webpack({ ...require("../../webpack.config.js"), mode: "development" });
  const middleware = require("webpack-dev-middleware");
  app.use(middleware(compiler));
}

const port = process.env.PORT || 3000;

app.get("/proxy/:url", async (req, res) => {
  const { url } = req.params;
  const type = await fetch(url, { method: "HEAD" }).then(r => r.headers.get("content-type"));
  if (type && type.startsWith("text/html")) {
    try {
      const og = await ogs({ url, onlyGetOpenGraphInfo: true, headers: { "user-agent": "Firefox/99" } });
      const { ogImage } = og.data;
      const ogImageUrl = ogImage && (ogImage.length ? ogImage[ogImage.length - 1].url : ogImage.url);
      if (ogImageUrl) {
        fetch(ogImageUrl).then(r => r.body.pipe(res));
      } else {
        res.status(404).end();
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    fetch(req.params.url).then(r => r.body.pipe(res));
  }
});

app.use(express.static("./src/client/"));

app.listen(port, () => console.log(`Listening on port ${port}!`));
