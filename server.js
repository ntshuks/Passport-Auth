/*
This version will use passport js to manage user login status
*/

const express = require('express');
const app = express();
const session = require('express-session');
require('dotenv').config();
const bodyParser= require('body-parser');
const passport = require('passport');
const PORT = process.env.PORT || 5003;
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const saltrounds = 10;
const User = require('./db.js');
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri: process.env.STORE_URI,
    collection: 'mySessions' 
});

let msg;

// bring in passport config
const PassportConfig = require('./passport-config.js');
PassportConfig(passport);

const flash = require('express-flash');

console.log(process.env.STORE_URI);

store.on('error', (error) => {
    console.log(error);
});

app.set('view engine', 'ejs');

// Static file folder
app.use(express.static('public'));

//Body Parser to allow form data to be accessed
app.use(bodyParser.urlencoded({ extended: false }));

// Express Session middleware
app.use(session({
    secret: process.env.SECRET,
    name: 'UniqueSessionId',
    resave: false,
    store: store,
    saveUninitialized: false,
    // cookie: {
    //     secure: true,
    //     httpOnly: true,
    //     sameSite: 'none',
    //     maxAge: 60 * 60 * 24 * 1000
    //   },
}));

//Flash messages - after session set up
app.use(flash());

// Make Flash messages available
app.use((req, res, next) => {
    res.locals.msg = msg;
    //res.locals.error_msg = errormsg;
    console.log('Inside app use');
        console.log(res.locals.msg);
    next();
});

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

// DB connection
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true,useUnifiedTopology: true,})
.then(() => console.log('DB connected...'))
.catch ((err) => console.log(err));

// Routes
app.get('/', IsNotAuthed, (req,res) => {
    res.render('index');
});

app.get('/register', IsNotAuthed, (req,res) => {
    res.locals.msg = '';
    res.render('register');
});

app.get('/login', IsNotAuthed, (req,res) => {
    res.locals.msg = '';
    res.render('login');
});

app.get('/secret', IsAuthed, (req,res) => {
        res.render('secret');
    });

app.get('/logout', (req,res,next) => {
   // drop them onto starter page
    req.logout( (err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    })
});

app.post('/register', (req,res) => {
    const email = req.body.email;
    const plainPassword = req.body.password;
    //check to see if emial already registered
    User.findOne({email: email})
    .then((user) => {
        if (user) {
            console.log(user);
            let text= `Email: ${email} already registered`;
            msg = MakeMessage(text);
            //console.log(req.flash(error_msg));
            console.log(msg);
            res.redirect('/register');
        } else {
        //  create new user
        let text ='';
        bcrypt.hash(plainPassword, saltrounds, (err,hash) => {
            if(err) throw err;
        User.create({ email: email, password: hash })
        .then(() => console.log("User created"))
        .then( text = "You are now registered. Please login")
        .then( MakeMessage(text))
        .then(res.redirect('/login'))
        .catch ((err) => console.log(err));    
           })
        }
    })
    .catch((err) => console.log(err)) 
     }); 

app.post('/login', passport.authenticate('local', 
    {failureRedirect: '/login', failureFlash: true }),(req,res) => {
    // If it drops here, the authentication was successful
    //req.flash('success_msg', 'welcome to the very secret page');
    let text = "welcome to the very secret page";
    MakeMessage(text);
    res.redirect('/secret');
});

function IsAuthed(req,res,next) {
    console.log("Is Authenticated?");
    console.log(req.isAuthenticated());
   if (req.isAuthenticated()) {
    next();
    } else {
        let text = "You need to be logged in to access that page";
        MakeMessage(text);
        res.redirect('login');
    }
}

function IsNotAuthed(req,res,next) {
    console.log("Is Authenticated?");
    console.log(req.isAuthenticated());
    if (!req.isAuthenticated()) {
     next();
     } else {
        let text ="You need to log out first";
        MakeMessage(text);
         res.redirect('/secret');
     }
 }

 function MakeMessage(text) {
    //clear previous messages
    msg = text;
    console.log('Inside MakeMessage');
    console.log(msg);
    return(msg);
 }


app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});