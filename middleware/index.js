const express = require('express');
const router = express.Router();
const Content = require("../models/content");
const Comment = require("../models/comment");
const moment = require('moment');

module.exports = {
  // Require a user to login
	authCheck: function(req, res, next){
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
        if(err){
          req.flash("error", "Unauthorized Access");
          res.redirect("back");
        } else if(content.author.id.equals(req.user._id)){
          next();
        } else {
          req.flash("error", "You don't have permission");
          console.log("error");
          res.redirect('/' + req.user.lang + "/contents/" + req.params.id);
        }
      });
    } else {
      req.flash("error", "You need to be signed in to do that!");
      res.redirect("/auth/login");
    }
  }
}