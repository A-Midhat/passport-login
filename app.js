/**
* This code sets up an Express.js server with authentication functionality using Passport.js.
* It connects to a MongoDB database, defines a user schema, and sets up routes for login, registration, and accessing a "secrets" page.
* The server listens on port 3000 and logs a message when it starts.
*/
require('dotenv').config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
const ejs = require("ejs");
const bodyParser = require("body-parser");


const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
secret: "Our little secret.",
resave: false,
saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
email: String,
password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", (req, res) => {
res.render("home");
});

app.route("/login")
.get((req, res) => {
res.render("login");
})
.post((req, res) => {
const user = new User({
username: req.body.username,
password: req.body.password
});
req.login(user, (err) => {
if (err) {
console.error(err);
}
else {
passport.authenticate("local")(req, res, () => {
res.redirect("/secrets");
});
}
});
});

app.route("/register")
.get((req, res) => {
res.render("register");
})
.post((req, res) => {
User.register({ username: req.body.username }, req.body.password, (err, user) => {
if (err) {
console.error(err);
res.redirect("/register");
}
else {
passport.authenticate("local")(req, res, () => {
res.redirect("/secrets");
})
}
})
});


app.route("/secrets")
.get((req, res) => {
if (req.isAuthenticated()) {
console.log("Authenticated User");
res.render("secrets");
}
else {
console.log("Not Authenticated User");
res.redirect("/login");
}
})
app.route("/logout")
.get((req, res) => {
req.logout((err) => {
if (err) {
console.error(err);
}
else {
res.redirect("/");
}
});
})
app.listen(3000, () => {
console.log("Server started on port 3000");
});
