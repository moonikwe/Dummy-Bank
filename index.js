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
const facebook = './routes/facebook';
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
app.use(require(facebook));
app.get('/', function(req, res) {
	res.render('index.html');
});

var user = function  retrieveSignedInUser(req, res, next){
	req.user = req.session.currentUser;
	next();
}
app.use(user);

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
	const email = req.user;

	const q1 = "SELECT * FROM accounts WHERE user_id IN (SELECT id FROM users WHERE email= '" + email + "')";
	const q2 = "SELECT * FROM accounts WHERE user_id IN (SELECT id FROM users WHERE email= '" + recipient + "')";
	if(amount <= 0){
		req.flash('transferStatus', 'Amount must be greater than zero!');
		res.redirect('/profile');
	}
	else{
		database.query(q1, { model: Account }).then(function(sender){
			var jsonString = JSON.stringify(sender[0]);
			var senderObj = JSON.parse(jsonString);
			var senderBal = parseInt(senderObj.balance, 10);
			var senderId = parseInt(senderObj.id,10);

			console.log("SENDER >> "+senderId);
			console.log("sender is "+sender.constructor.name);
			console.log("Send = "+senderBal);
	  		database.query(q2, { model: Account }).then(function(receiver){
	  			var jString = JSON.stringify(receiver[0]);
				var receiverObj = JSON.parse(jString);
				var receiverBal = parseInt(receiverObj.balance, 10);
				var receiverId = parseInt(receiverObj.id, 10);
				console.log("Sendddd = "+receiverBal);
				console.log("receiverId = "+receiverId);
	  			database.transaction(function(t) {
					return Account.update({
						balance: senderBal - amount
					},{where:{ user_id: senderId}}, 
						{ transaction: t }).then(function() {
						return Account.update({
							balance: receiverBal + amount
						},{where: { user_id: receiverId }}, { transaction: t });
					});
				}).then(function() {
					req.flash('statusMessage', 'Transferred ' + amount + ' to ' + recipient);
					res.redirect('/profile');
				});
			});
		});
	}
});
app.post('/deposit', requireSignedIn, function(req, res){
	const deposit = parseInt(req.body.amount, 10);
	const email = req.user;
	if(deposit <= 0){
		req.flash('depositStatus', 'Amount must be greater than zero!');
		res.redirect('/profile');
	}
	else{
		User.findOne({where: {email: email}}).then(function(owner){
			Account.findOne({where: {user_id: owner.id}}).then(function(ownerAccount){
				database.transaction(function(t){
					return ownerAccount.update({
						balance: ownerAccount.balance + deposit
					}, { transaction: t });
				}).then(function() {
					req.flash('depositStatus', 'Deposit successful ');
					res.redirect('/profile');
				});
			});
		});
	}

});
app.post('/withdraw', requireSignedIn, function(req, res){
	const withdraw = parseInt(req.body.withdrawal, 10);
	const email = req.session.currentUser;
	console.log("Withdraw = "+withdraw+ "W/O Parsing: "+ req.body.withdrawal);

	User.findOne({where: {email: email}}).then(function(owner){
		Account.findOne({where: {user_id: owner.id}}).then(function(ownerAccount){

			if(withdraw > ownerAccount.balance){
					req.flash('withdrawStatus', 'Insufficient Balance');
					res.redirect('/profile');
			}
			else if(withdraw <= 0){
				req.flash('withdrawStatus', 'Amount must be greater than zero!');
				res.redirect('/profile');
			}
			else{
				database.transaction(function(t){
					// console.log("USER's BALANCE = "+ownerAccount.balance+" Withdraw = "+withdraw);
					if(ownerAccount.balance >= withdraw){
						return ownerAccount.update({
							balance: ownerAccount.balance - withdraw
						}, { transaction: t });
					}
				}).then(function(){
					req.flash('withdrawStatus', 'Withdraw successful');
					res.redirect('/profile');
				});
			}
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
