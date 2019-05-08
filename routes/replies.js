var express = require("express");
var router  = express.Router({mergeParams: true});
var Content = require("../models/content");
var Comment = require("../models/comment");
var middleware = require("../middleware");


//Create Comments on Comment
router.post("/contents/:id/comments/:commentId/comments", middleware.authCheck ,function(req, res){
   //lookup content using ID
  Comment.findById(req.params.commentId, function(err, foundComment){
    if(err){
      console.log(err);
      req.flash('error', 'Cannot find a comment');
    } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
               req.flash('error', 'Cannot create a comment');

           } else {
               //add username and id to comment
              comment.author.id = req.user._id;
              comment.author.username = req.user.username;
              comment.txt = req.body.txt;
              var timeNow = new Date();
              comment.createdAt = timeNow;

              //save comment
              comment.save();

              foundComment.comments.push(comment);
              foundComment.save();
              console.log(comment);

              req.flash('success', 'Created a comment!');
           }
        });
      }
   });
});

