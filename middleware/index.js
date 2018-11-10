const express = require('express');
const router = express.Router();
const Comment = require("../models/comment");
const Content = require("../models/content");

module.exports = {
  // Require a user to login
	authCheck: (req, res, next) => {
	    if(!req.user){
	        // if user is not looged in
	        res.redirect('/auth/login');
	    } else {
	        // if logged in
	        next();
	    }
	},
  // Verify ownership of a content
	checkUserContent: function(req, res, next){
        if(req.user){
            Content.findById(req.params.id, function(err, content){
               if(content.author.id.equals(req.user._id)){
                   next();
               } else {
                   req.flash("error", "You don't have permission to do that!");
                   console.log("BADD!!!");
                   res.redirect("/contents/" + req.params.id);
               }
            });
        } else {
            req.flash("error", "You need to be signed in to do that!");
            res.redirect("/login");
        }
    },
  // Verify ownership of a comment
  checkUserComment: function(req, res, next){
      console.log("YOU MADE IT!");
      if(req.user){
          Comment.findById(req.params.commentId, function(err, comment){
             if(comment.author.id.equals(req.user._id)){
                 next();
             } else {
                 req.flash("error", "You don't have permission to do that!");
                 res.redirect("/contents/" + req.params.id);
             }
          });
      } else {
          req.flash("error", "You need to be signed in to do that!");
          res.redirect("login");
      }
  }
}