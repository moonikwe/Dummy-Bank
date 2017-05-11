const express = require('express');
const bodyparser = require('body-parser');
const cookieparser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const consolidate = require('consolidate');
const passport = require('./config/passport');
const database = require('./database');
const User = require('./models').User;
const Account = require('./models').Account;
const routes ='./routes/auth-routes';
const twitter = './routes/twitter';
const app = express();

app.engine('html', consolidate.nunjucks);
app.set('views', './views');

app.use(bodyparser.urlencoded({extended: true}));
app.use(cookieparser('secret-cookie'));
app.use(session({ resave: false, saveUninitialized: false, secret: 'secret-cookie' }));
app.use(flash());
app.use(passport.initialize());

app.use('/static', express.static('./static'));
app.use(require(routes));
app.use(require(twitter));
app.get('/', function(req, res) {
	res.render('index.html');
});

app.get('/profile', requireSignedIn, function(req, res) {
	const email = req.session.currentUser;
	User.findOne({ where: { email: email } }).then(function(user) {
		res.render('profile.html', {
			user: user
		});
	});
});

app.post('/transfer', requireSignedIn, function(req, res) {
	const recipient = req.body.recipient;
	const amount = parseInt(req.body.amount, 10);

	const email = req.session.currentUser;
	User.findOne({ where: { email: email } }).then(function(sender) {
		User.findOne({ where: { email: recipient } }).then(function(receiver) {
			Account.findOne({ where: { user_id: sender.id } }).then(function(senderAccount) {
				Account.findOne({ where: { user_id: receiver.id } }).then(function(receiverAccount) {
					database.transaction(function(t) {
						return senderAccount.update({
							balance: senderAccount.balance - amount
						}, { transaction: t }).then(function() {
							return receiverAccount.update({
								balance: receiverAccount.balance + amount
							}, { transaction: t });
						});
					}).then(function() {
						req.flash('statusMessage', 'Transferred ' + amount + ' to ' + recipient);
						res.redirect('/profile');
					});
				});
			});
		});
	});
});
app.post('/deposit', requireSignedIn, function(req, res){
	const deposit = parseInt(req.body.deposit, 10);
	const email = req.session.currentUser;
	User.findOne({where: {email: email}}).then(function(owner){
		Account.findOne({where: {user_id: owner.id}}).then(function(ownerAccount){
			database.transaction(function(t){
				return ownerAccount.update({
					balance: ownerAccount.balance + deposit
				}, { transaction: t });
			}).then(function() {
				req.flash('statusMessage', 'Deposit successful ');
				res.redirect('/profile');
			});
		});
	});

});
app.post('/withdraw', requireSignedIn, function(req, res){
	const withdraw = parseInt(req.body.withdraw, 10);
	const email = req.session.currentUser;
	User.findOne({where: {email: email}}).then(function(owner){
		Account.findOne({where: {user_id: owner.id}}).then(function(ownerAccount){
			database.transaction(function(t){
				if(ownerAccount.balance >= withdraw){
					return ownerAccount.update({
						balance: ownerAccount.balance - withdraw
					}, { transaction: t });
				}
			}).then(function(){
				req.flash('statusMessage', 'Withdraw successful');
				res.redirect('/profile');
			});
		});
	});
});


function requireSignedIn(req, res, next) {
    if (!req.session.currentUser) {
        return res.redirect('/');
    }
    next();
}

app.listen(3000, function() {
	console.log('Server is now running at port 3000');
});
