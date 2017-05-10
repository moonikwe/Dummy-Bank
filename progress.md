## STEPS
- npm install
- create user bankuser with password 'bankpassword';
- create database bankdb with owner bankuser;
- [models.js] database.sync();
- [index.js] app.use(bodyparser.urlencoded({extended: true}));
- [auth-routes.js]
    const database = require('./database');
    const Account = require('./models').Account;

    database.transaction( function (t) {
    return User.create({
        email: email,
        password: hashedPassword,
        salt: salt
    }, {
      transaction: t
    }).then(function () {
       User.findOne({ where: { email: email } }).then(function(user) {
          if(user !== null){
            Account.create({
              user_id: user.id
            }).then(function() {
              req.flash('signUpMessage', 'Signed up successfully!');
              return res.redirect('/');
            });
          }
       });
     });
   });
   



Sources:
http://stackoverflow.com/questions/38281709/how-to-suppress-npm-warn-deprecated-messages-in-bash
