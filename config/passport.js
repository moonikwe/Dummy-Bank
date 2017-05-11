const passport = require('passport');
const TwitterPassport = require('passport-twitter');
const FacebookPassport = require('passport-facebook');
const User = require('../models').User;
const Account = require('../models').Account;

passport.use(new TwitterPassport({
    consumerKey: '7mNd39P1eKcfpBF42skNxU6gV',
    consumerSecret: 'ng5453RTqS1ltO7AWyowl53RYk6KMqqRK72gpOq5Plm7QRmME0',
    callbackURL: 'http://localhost:3000/auth/twitter/callback'
}, function(token, secret, profile, cb) {
    console.log("SIGNING IN WITH TWITTER USER :"+profile.displayName);
    User.findOrCreate({
        where: { email: profile.username },
        defaults: { password: '' }
    }).then(function(result) {
        Account.create({
            user_id: result[0].id
        });
        cb(null, result[0]);
    });
}));
passport.use(new FacebookPassport({
    clientID: '867484116725564',
    clientSecret: 'f75da67982c94866b986bdcc79e7a4dd',
    callbackURL: 'http://localhost:3000/auth/facebook/callback'
}, function(token, secret, profile, cb) {
    User.findOrCreate({
        where: { email: profile.username },
        defaults: { password: '' }
    }).then(function(result) {
        Account.create({
            user_id: result[0].id
        });
        cb(null, result[0]);
    });
}));
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findOne({ where: { id: id } }).then(function(user) {
        done(null, user);
    });
});

module.exports = passport;
