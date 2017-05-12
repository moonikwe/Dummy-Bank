const passport = require('passport');
const TwitterPassport = require('passport-twitter');
const FacebookPassport = require('passport-facebook');
const User = require('../models').User;
const Account = require('../models').Account;

passport.use(new FacebookPassport({
    clientID: '867484116725564',
    clientSecret: 'f75da67982c94866b986bdcc79e7a4dd',
    callbackURL: 'http://localhost:3000/auth/facebook/callback'
}, function(token, secret, profile, done) {
     console.log("SIGNING IN WITH fb USER :"+JSON.stringify(profile));
    User.findOrCreate({
        where: { email:  profile.id, name: profile.displayName},
        defaults: { password: ''}
    }).then(function(result) {
         console.log("Console ID :"+ result[0].id);
         Account.findOrCreate({
             where: { user_id: result[0].id}
         });
        done(null, result[0]);
    });
}));

passport.use(new TwitterPassport({
    consumerKey: '7mNd39P1eKcfpBF42skNxU6gV',
    consumerSecret: 'ng5453RTqS1ltO7AWyowl53RYk6KMqqRK72gpOq5Plm7QRmME0',
    callbackURL: 'http://localhost:3000/auth/twitter/callback'
}, function(token, secret, profile, cb) {
    // console.log("SIGNING IN WITH TWITTER USER :"+JSON.stringify(profile));
    User.findOrCreate({
        where: { email: profile.username, name : profile.displayName },
        defaults: { password: '' }
    }).then(function(result) {
        Account.findOrCreate({
            where: { user_id: result[0].id}
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
