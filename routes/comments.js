var express = require("express");
var router  = express.Router({mergeParams: true});
var Content = require("../models/content");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//Comments New
router.get("/new", middleware.authCheck, function(req, res){
    // find content by id
    console.log(req.params.id);
    Content.findById(req.params.id, function(err, content){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {content: content});
        }
    })
});

//Comments Create
router.post("/", middleware.authCheck ,function(req, res){
   //lookup content using ID
   Content.findById(req.params.id, function(err, content){
       if(err){
           console.log(err);
           res.redirect("/contents");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               comment.txt = req.body.txt;
               var timeNow = new Date();
               comment.createdAt = timeNow;

               //save comment
               comment.save();

               content.comments.push(comment);
               content.save();
               console.log(comment);

               req.flash('success', 'Created a comment!');
               res.redirect('/contents/' + content._id);
           }
        });
       }
   });
});

router.post("/:commentId/comments", middleware.authCheck ,function(req, res){
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
              res.redirect('/contents/' + req.params.id);
           }
        });
      }
   });
});

router.get("/:commentId/edit", middleware.authCheck, function(req, res){
    // find content by id
    Comment.findById(req.params.commentId, function(err, comment){
        if(err){
            console.log(err);
        } else {
            res.render("comments/edit", {content_id: req.params.id, comment: comment});
        }
    })
});

router.put("/:commentId", function(req, res){
   Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, comment){
       if(err){
           res.render("edit");
       } else {
          res.redirect("/contents/" + req.params.id);
       }
   }); 
});

router.get("/:commentId", function(req, res){
  Content.findById(req.params.id).populate("comments").exec(function(err, foundContent){
    if(err){
      console.log(err);
    } else {
      console.log(foundContent)
      Comment.findById(req.params.commentId).populate("comments").exec(function(err, foundComment){
          if(err){
            console.log(err);
            req.flash('error', 'Cannot find a comment');
          } else {
            
            res.render('comments/reply', {content: foundContent, content_id: req.params.id, comment: foundComment});
          }
      });        
    }
  });
});

router.delete("/:commentId", function(req, res){
    Comment.findByIdAndRemove(req.params.commentId, function(err){
        if(err){
          console.log("PROBLEM Delete Operation");
        } else {
          res.redirect("/contents/" + req.params.id);
        }
    })
});

module.exports = router;