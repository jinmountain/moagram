const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const LocalStrategy = require('passport-local').Strategy;
const keys = require('./keys');
const User = require('../models/user');

// expose this function to our app using module.exports

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // // =========================================================================
    // // LOCAL LOGIN =============================================================
    // // =========================================================================
    // // we are using named strategies since we have one for login and one for signup
    // // by default, if there was no name, it would just be called 'local'

    // passport.use('local-login', new LocalStrategy({
    //     // by default, local strategy uses username and password, we will override with email
    //     usernameField : 'email',
    //     passwordField : 'password',
    //     passReqToCallback : true // allows us to pass back the entire request to the callback
    // },
    // function(req, email, password, done) { // callback with email and password from our form

    //     // find a user whose email is the same as the forms email
    //     // we are checking to see if the user trying to login already exists
    //     User.findOne({ 'local.email' :  email }, function(err, user) {
    //         // if there are any errors, return the error before anything else
    //         if (err) {
    //             console.log(err);
    //         }

    //         // if no user is found, return the message
    //         if (!user) {
    //             req.flash('error', 'No user found.'); // req.flash is the way to set flashdata using connect-flash
    //         }

    //         // if the user is found but the password is wrong
    //         if (!user.validPassword(password)) {
    //             req.flash('error', 'Oops! Wrong password.'); // create the loginMessage and save it to session as flashdata
    //         }

    //         // all is well, return successful user
    //         return done(null, user);
    //     });

    // }));

    // // =========================================================================
    // // LOCAL SIGNUP ============================================================
    // // =========================================================================
    // // we are using named strategies since we have one for login and one for signup
    // // by default, if there was no name, it would just be called 'local'

    // passport.use('local-signup', new LocalStrategy({
    //     // by default, local strategy uses username and password, we will override with email
    //     usernameField : 'email',
    //     passwordField : 'password',
    //     passReqToCallback : true // allows us to pass back the entire request to the callback
    // },
    // function(req, email, password, done) {

    //     // asynchronous
    //     // User.findOne wont fire unless data is sent back
    //     process.nextTick(function() {

    //     // find a user whose email is the same as the forms email
    //     // we are checking to see if the user trying to login already exists
    //     User.findOne({ 'local.email' :  email }, function(err, user) {
    //         // if there are any errors, return the error
    //         if (err) {
    //             console.log(err);
    //         }

    //         // check to see if theres already a user with that email
    //         if (user) {
    //             console.log(user);
    //             req.flash('error', 'That email is already taken.');
    //         } else {

    //             // if there is no user with that email
    //             // create the user
    //             var newUser = new User();

    //             // set the user's local credentials
    //             newUser.method = 'local';
    //             newUser.local.email    = email;
    //             newUser.local.password = newUser.generateHash(password);

    //             // save the user
    //             newUser.save(function(err) {
    //                 if (err) {
    //                     console.log(err);
    //                 } else {
    //                     console.log(newUser);
    //                 }
    //             });
    //         }
    //     });    
    //     });
    // }));

//Google oauth strategy
passport.use(
	new GoogleStrategy({
		callbackURL: '/auth/google/redirect',
		clientID: keys.google.clientID,
		clientSecret: keys.google.clientSecret
	}, (accessToken, refreshToken, profile, done) => {
        console.log(profile);
		User.findOne({googleId: profile.id}).then((currentUser) => {
            if(currentUser){
                console.log('user is: ', currentUser);
                if(currentUser.username != profile.displayName || currentUser.thumbnail != profile._json.image.url){
                    var newData = {
                        username: profile.displayName,
                        thumbnail: profile._json.image.url
                    };

                    User.findByIdAndUpdate(currentUser.id, {$set: newData}, function(err, foundUser){
                        if(err){
                            console.log(err);
                        } else {
                            done(null, foundUser);
                        }
                    });
                } else {
                    done(null, currentUser);
                }
            } else {
                new User({
                    username: profile.displayName,
                    googleId: profile.id,
                    thumbnail: profile._json.image.url,
                    email: profile.emails[0].value,
                    follower: 0,
                    lang: profile._json.language,
                    emailPrivacy: "public"

                }).save().then((newUser) => {
                    console.log('new user created: ' + newUser);
                    done(null, newUser);
                })
            }
        })
    })
)


	
