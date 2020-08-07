const moment = require('moment');

// ======== MODELS ========
const User = require('../models/user');
const Content = require('../models/content');
const Comment = require('../models/comment');

// SOCKET IO COMMENT AND REPLY 
module.exports = (io) => {
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
}
