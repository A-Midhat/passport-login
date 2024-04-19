require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const md5 = require("md5");
// const encrypt = require("mongoose-encryption");

const app = express();

mongoose.connect("mongodb://localhost:27017/userDB");
app.set("view engine", "ejs");  
app.use(bodyParser.urlencoded({ extended: true })); 

const userSchema = new mongoose.Schema({
    email : String,
    password: String
});
// const secret = process.env.SECRET;
// userSchema.plugin(encrypt,{secret:secret, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});


 app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post(async(req,res)=>{
        const user = await User.findOne({email:req.body.username});
        if(user){
            if(user.password === md5(req.body.password)){
                console.log("Welcome user!");
                res.render("secrets");
            } else {
                console.log("Invalid password. Please try again.");
                res.render("login")
            }
        }
        else {
            console.log("No user found with the provided email.");
            res.render("login");
        }
    
    })

app.route("/register")
    .get((req, res) => {
    
        res.render("register");
  })
    .post(async(req,res)=>{
        const newUser = new User({
            email: req.body.username,
            password: md5(req.body.password) // hash the password and save h
        });
        console.log("before hash function=>:" ,req.body.password,"after hash function=>:" ,md5(req.body.password));
        await newUser.save();
        console.log("New user registered!");
        res.render("secrets");

    })


app.listen(3000, () => {
  console.log("Server started on port 3000");
});
