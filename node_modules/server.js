module.exports = (port, root) => {
  const express = require('express');
  const php = require("node-php");
  const path = require("path");

  const app = express();
  app.use((req, res, next) => {
    if (req.url === '/favicon.ico') {
      res.writeHead(200, {'Content-Type': 'image/x-icon'} );
      res.end(/* icon content */);
    } else {
      next();
    }
  });
  app.use("/", php.cgi(root));

  app.listen(port);

  console.log(`Server listening on port ${port}`);
};
