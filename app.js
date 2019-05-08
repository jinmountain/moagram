// ======== NPMS ========
const express = require('express');
const http = require('http');
const enforce = require('express-sslify');
const debug = require('debug')('app:startup');
const morgan = require('morgan');
const flash = require("connect-flash");
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require("passport-local")
const passportSetup = require('./config/passport-setup');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const ejsLint = require('ejs-lint');
const methodOverride = require("method-override");
const moment = require('moment');
const urlParser = require('js-video-url-parser');
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

// ======== ROUTES ========
const contents = require('./routes/contents');
const replies = require('./routes/replies');
const home = require('./routes/home');
const profile = require('./routes/profile');
const auth = require('./routes/auth');
const keys = require('./config/keys');
const configDB = require('./config/database.js');

// ======== MODELS ========
const User = require('./models/user');

//app.use(express.static('public'));
app.use(express.static(__dirname + "/public"));

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// ======== encrypt the cookie ========
app.use(cookieSession({
	maxAge: 24 * 60 * 60 * 1000, //24hours
	keys: [keys.session.cookieKey]
}));

// ======== initialize passport ========
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use(methodOverride('_method'));

app.use(function(req, res, next){
   res.locals.user = req.user;
   res.locals.moment = moment;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});

// ======== Fast Route ========
app.use(function(req, res, next){
	if (req.user) {
		app.use('/' + req.user.lang + '/contents', contents);
		app.use('/' + req.user.lang + '/profile', profile);
		next();
	} else {
		app.use('/en/contents', contents);
		app.use('/en/profile', profile);
		next();
	}
});

app.use('/auth', auth);
app.use('/', home);

// ========= Using EJS View Engine ========
app.set('view engine', 'ejs');
app.set('views', './views');

if (app.get('env') === 'development') {
	app.use(morgan('tiny'));
	debug('morgan enabled ...');
};

// ======== DATABASE AND SERVER ========
mongoose.connect(configDB.url, { useNewUrlParser: true })
	.then(() => console.log('Connected to MongoDB...'))
	.catch(err => console.error("could not connect to mongoDB"));
	
app.use(enforce.HTTPS({ trustProtoHeader: true }));
const port  = process.env.PORT || 3000;
http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
