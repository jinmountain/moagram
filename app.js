// ======== NPMS ========
const debug = require('debug')('app:startup');
const morgan = require('morgan');
const flash = require("connect-flash");
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const http = require('http').Server(app);
const io = require("socket.io")(http);

const enforce = require('express-sslify');
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

// ======== ROUTES ========
const contents = require('./routes/contents');
const home = require('./routes/home');
const profile = require('./routes/profile');
const auth = require('./routes/auth');
const keys = require('./config/keys');
const configDB = require('./config/database.js');

// ======== MODELS ========
const User = require('./models/user');
const Content = require('./models/content');
const Comment = require('./models/comment');

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
app.use('/contents', contents);
app.use('/profile', profile);
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

// SOCKET IO COMMENT AND REPLY 
io.on('connection', function(socket){
  console.log("Socket Connected...");

  socket.on('comment', function(data){

    var commentData = new Comment(data);
    commentData.save();

    Content.findById(data.contentId, function(err, foundContent){
      if(err){
        console.log(err);
      } else {
        foundContent.comments.push(commentData._id);
        foundContent.save();
      }
    });

    socket.broadcast.emit('comment', data);  
  });

  socket.on('deleteComment', function(data){
    var commentId = data.commentId;
    var currentUser = data.currentUser;

    Comment.findByIdAndRemove(commentId, function(err, foundComment){
      if(err){
        console.log(err);
      } else {
        if(foundComment.author.id == currentUser){
          Content.update(
            {'_id': foundComment.contentId},
            {$pull: {'comments': foundComment._id}})
          .exec(function(err){
            if(err){
              console.log(err);
            } else {
              socket.broadcast.emit('deleteComment', data);
            }
          });
        } else {
          console.log("Not Authiorized to Delete the Comment");
        }
      }
    });
  });

  socket.on('editComment', function(data){
    var commentId = data.commentId;
    var currentUser = data.currentUser;

    var newData = {
      comment: data.comment,
      edited: true
    }
    Comment.findById(commentId, function(err, foundComment){
      if(err){
        console.log(err);
      } else {
        if(foundComment.author.id == currentUser){
          Comment.findByIdAndUpdate(commentId, {$set: newData}, function(err){
            if(err){
              console.log(err);
            } else {
              socket.broadcast.emit('editComment', data);
            }
          });
        } else {
          console.log("Not Authiorized to Edit the Comment");
        }
      }
    });
  });

  //=================SOCKET REPLY=============================
  socket.on('reply', function(data){
    var commentId = data.commentId;

    Comment.findById(commentId, function(err, foundComment){
        if(err){
            console.log(err);
        } else {
            console.log(foundComment);
            foundComment.replies.push(data);
            console.log(data);
            foundComment.save();
        }
    });
    socket.broadcast.emit('reply', data);    
  });

  socket.on('deleteReply', function(data){
    var replyId = data.replyId;
    var commentId = data.commentId;
    var currentUser = data.currentUser;

    Comment.update(
      {
        _id: commentId,
      },
      {$pull:  
        {'replies': {_id: replyId}}
      }
    )
    .exec(function(err){
      if(err){
        console.log(err);
      } else {
        socket.broadcast.emit('deleteReply', data);
      }
    });
  });

  socket.on('editReply', function(data){
    var commentId = data.commentId;
    var replyId = data.replyId;

    var newData = {
      reply: data.reply,
      edited: true
    }

    Comment.update(
      {
        _id: commentId,
        'replies._id':replyId
      },
      {
        $set: {
          'replies.$.reply': newData.reply,
          'replies.$.edited': newData.edited
        } 
      }
    ).exec(function(err){
      if(err){
        console.log(err);
      } else {
        socket.broadcast.emit('editReply', data);
      }
    });
  });

  //LIKE AND UNLIKE
  socket.on('likeContent', function(data){
    var dateNow = moment();

    Content.findById(data.contentId, function (err, foundContent) {
      if (err) {
        err.httpStatusCode = 500
        return next(err);
      } else { 
        User.findById(data.userId, function(err, foundUser) {
          if (err) {
            err.httpStatusCode = 500
            return next(err);
          } else {
            if (foundUser.contentLiked.indexOf(foundContent._id) != -1) {
                
              foundContent.likes -= 1;

              var likeCount = parseInt(foundContent.likes);
              //send a message to ALL connected clients
              io.emit('contentLikeUpdate', likeCount);
              
              // every time someone like a post,
              // the post is updated with newly calculated hotness
              var dateNow = moment();
              var now = moment(new Date()); //todays date
              var end = moment(foundContent.createdAt); // another date
              var diff = now.diff(end); //difference between now and end
              var duration = moment.duration(diff);
              var hours = duration.asHours();
              var growth = (foundContent.views*3) + (foundContent.likes*30);
              var newHotness = (growth*30)/hours;
              foundContent.hotness = newHotness;
              //================================
              foundContent.save();
              
              foundUser.contentLiked.pull(foundContent._id);
              foundUser.lastActiveTime = dateNow;
              foundUser.save();

            } else {

              foundContent.likes += 1;

              var likeCount = parseInt(foundContent.likes);

              //send a message to ALL connected clients
              io.emit('contentLikeUpdate', likeCount);
            
              // every time someone like a post,
              // the post is updated with newly calculated hotness
              var now = moment(new Date()); //todays date
              var end = moment(foundContent.createdAt); // another date
              var duration = moment.duration(now.diff(end));
              var hours = duration.asHours();
              var growth = (foundContent.views*3) + (foundContent.likes*30);
              var newHotness = (growth*30)/hours;
              foundContent.hotness = newHotness;
              //================================
              foundContent.save();

              foundUser.contentLiked.push(foundContent._id);
              foundUser.save();
            }
          }
        });
      }
    });
  });

});
	
app.use(enforce.HTTPS({ trustProtoHeader: true }));
const port  = process.env.PORT || 3000;
http.listen(port, function() {
	console.log('Express server listening on port ' + this.address().port);
});
