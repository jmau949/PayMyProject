require("dotenv").config();

// Dependencies
const url = require("url");
const express = require("express");
const exSession = require("express-session");
const redis = require("redis");
const redisStore = require("connect-redis")(exSession);
const expressLayouts = require("express-ejs-layouts");

// Sequelize models
const db = require("./models");

// Intialize express app
const app = express();

// Define session and redis constants
const PORT = process.env.PORT || 8000;
const SESS_NAME = "sid";
const SESS_SECRET = "pmp-secret-donotreveal";
const SESS_LIFE = 1000 * 60 * 60;
const REDIS_HOST = "localhost"; // url.parse(process.env.REDIS_URL).hostname || 
const REDIS_PORT = 6379; // Number(url.parse(process.env.REDIS_URL).port) 

// Create redis client
const client = redis.createClient();

// Middleware
app.use(exSession({
  name: SESS_NAME,
  secret: SESS_SECRET,
  store: new redisStore({
    host: REDIS_HOST,
    port: REDIS_PORT,
    client: client
  }),
  saveUninitialized: false,
  resave: false,
  cookie: {
    maxAge: SESS_LIFE,
    sameSite: true
  }
}));

app.use(
  express.urlencoded({
    extended: false
  })
);

app.use(express.json());
app.use(express.static(__dirname + "/public"));

app.set("view engine", "ejs");
app.use(expressLayouts);

// Routes

require("./routes/userRoutes.js")(app, db);
require("./routes/htmlRoutes.js")(app, db);

const syncOptions = {
  force: false
};

// If running a test, set syncOptions.force to true clearing the `pmp_db`
if (process.env.NODE_ENV === "test") {
  syncOptions.force = true;
}

// Starting the server, syncing our models
db.sequelize.sync(syncOptions).then(function () {
  app.listen(PORT, function () {
    console.log(
      "==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.",
      PORT,
      PORT
    );
  });
});

module.exports = app;