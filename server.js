// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const path = require('path');
const connectDB = require('./config/database');
const flash = require('connect-flash');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Passport Configuration
require('./config/passport-config')(passport);

// Middleware
// Body-parser to handle form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set view engine to EJS
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  })
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash Middleware (must be after session)
app.use(flash()); // << ADD THIS

// Global variables for flash messages
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

//Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/index'));
app.use('/', require('./routes/products'));
app.use('/grievances', require('./routes/grievances'));
app.use('/profile', require('./routes/profile')); 
app.use('/admin', require('./routes/admin')); 
app.use('/orders', require('./routes/orders')); 
app.use('/products', require('./routes/products'));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});