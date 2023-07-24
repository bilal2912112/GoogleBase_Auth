const fs = require("fs");
const express = require("express");
const https = require("https");
const path = require("path");
const helmet = require("helmet");
const passport = require("passport");
const { Strategy } = require("passport-google-oauth20");
const cookieSession = require("cookie-session");
const PORT = 3000;
require("dotenv").config();

const config = {
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  COOKIE_KEY_1: process.env.COOKIE_KEY_1,

  COOKIE_KEY_2: process.env.COOKIE_KEY_2,
};

const AUTH_OPTIONS = {
  callbackURL: "/auth/google/callback",
  clientID: config.CLIENT_ID,
  clientSecret: config.CLIENT_SECRET,
};

function verifyCallback(accessToken, refreshToken, profile, done) {
  console.log("google", profile);
  console.log("google access token", accessToken);
  done(null, profile);
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback));
//Save the session to the cookie
passport.serializeUser((user, done) => {
  done(null, user.id);
});
//Read the session from the cookie
passport.deserializeUser((id, done) => {
  done(null, id);
});
const app = express();
app.use(helmet());
app.use(
  cookieSession({
    name: "session",
    maxAge: 24 * 60 * 60 * 1000,
    keys: [config.COOKIE_KEY_1, config.COOKIE_KEY_2],
  })
);
app.use(passport.initialize());
app.use(passport.session());
function checkLogin(req, res, next) {
  const isLoggedIn = req.isAuthenticated() && req.user;
  if (!isLoggedIn) {
    return res.status(401).json({
      error: "you must login",
    });
  }

  next();
}
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email"],
  })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/failure",
    successRedirect: "/",
    session: true,
  }),
  (req, res) => {
    console.log("google call us back");
  }
);
app.get("/auth/logout", (req, res) => {
  req.logout();
  return res.redirect("/");
});
app.get("/secret", checkLogin, (req, res) => {
  return res.send("Your personal info");
});
app.get("/failure", (req, res) => {
  return res.send("Fail to Login");
});
app.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "index.html"));
});
https
  .createServer(
    {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
    },
    app
  )
  .listen(PORT, () => {
    console.log(`listining on  port ${PORT}`);
  });
