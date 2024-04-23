require('dotenv').config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
secret: process.env.SECRET,
resave: false,
saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret:[String]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
 

/* General Session*/
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLINET_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("Welcome mr."+profile.name.givenName);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) => {
    res.render("home");
});
app.route("/auth/google")
    .get(passport.authenticate("google", { scope: ["profile"] }));

app.route("/auth/google/secrets")
    .get(passport.authenticate("google", {failureRedirect: "/login"}), (req, res) => {
        res.redirect("/secrets");
    })

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
    .get(async (req, res) => {
        // show all secrets to non-authenticated users.
        const usersWithSecrets = await User.find({"secret":{$ne:null}}) // retursn all secret fields
        const allSecrets = [];
        usersWithSecrets.forEach(user=>{
            user.secret.forEach(secret=>{
                allSecrets.push(secret)
            })
        });
        res.render("secrets",{usersSecrets:allSecrets});;
    })

app.route("/submit")
    .get((req,res)=>{
        if (req.isAuthenticated()){
            console.log("submit your secret ... ");
            res.render("submit");
        }
        else {
            console.log("Not Authenticated User");
            res.redirect("/login");
        }
    })    

    .post(async (req,res)=>{
        if (req.isAuthenticated()){
            const sumbittedSecret = req.body.secret;
            const foundUser = await User.findById(req.user.id);
            if(foundUser){
                foundUser.secret.push(sumbittedSecret);
                await foundUser.save();
                console.log("Succefully submitted the secret!");
                res.redirect("/secrets");
            }
            else {
                console.log("Couldn't sumbit a secret!");
                res.redirect("/secrets");
            }
            
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
