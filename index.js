const express = require("express");
const http = require("http");
const path = require("path");
require("dotenv").config();

const dbConnection = require("./config/database");
const serialPort = require("./controllers/serial");
const routes = require("./routes");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use("/", routes);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;
