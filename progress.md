## STEPS
- npm install
- create user bankuser with password 'bankpassword';
- create database bankdb with owner bankuser;
- [models.js] database.sync();
- [index.js] app.use(bodyparser.urlencoded({extended: true}));


Sources:
http://stackoverflow.com/questions/38281709/how-to-suppress-npm-warn-deprecated-messages-in-bash
