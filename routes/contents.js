
// ======== npm ========
const express = require('express');
const router = express.Router();
const passport = require('passport');
const moment = require('moment');
const urlParser = require('js-video-url-parser');

// ======== routes ========
const Content = require('../models/content');
const Comment = require("../models/comment");
const User    = require("../models/user");
const profile = require("./profile");
const middleware = require("../middleware");
const configDB = require('../config/keys.js');

router.get('/', middleware.authCheck, (req, res) => {
    var noMatch = null;
    var perPage = 9;
    var page = req.query.page || 1;

	Content.find({})
    .sort({"createdAt": -1})
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .exec(function(err, allContents){
		if(err){
            console.log(err);
        } else {
            Content.count().exec(function(err, count){
                if(err) {
                    console.log(err);
                } else {
                    if(allContents.length <1 ) {
                        noMatch = "Nothing found, please try again.";
                    } 

                    res.render('contents/index', {
                        contents: allContents, 
                        noMatch: noMatch,
                        current: page,    
                        pages: Math.ceil(count / perPage),
                        url: req.url
                    });
                }
            });
        }
	})
});

router.get('/category/:category', middleware.authCheck, (req, res) => {
    var noMatch = null;
    var perPage = 9;
    var page = req.query.page || 1;
    var count;

    // Search with category
    
    const ctg = req.params.category;
    Content.find({category: ctg})
    .sort({"createdAt": -1})
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .exec(function(err, allContents){
        if(err){
            console.log(err);
        } else { 
            Content.find({category: ctg}).count().exec(function(err, count){
                if(err) {
                    console.log(err);
                } else {
                    if(allContents.length <1 ) {
                        noMatch = "Nothing found, please try again.";
                    } 

                    res.render('contents/index', {
                        contents: allContents, 
                        noMatch: noMatch,
                        current: page,    
                        pages: Math.ceil(count / perPage),
                        url: req.url
                    });
                }
            });
        }
    })
     
});

router.get('/search/:search', middleware.authCheck, (req, res) => {
    var noMatch = null;
    var perPage = 9;
    var page = req.query.page || 1;
    var count;

    // Search with name
    
    const regex = new RegExp(escapeRegex(req.params.search), 'gi');

    // Get all contentes from DB
    Content.find({name: regex})
    .sort({"createdAt": -1})
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .exec(function(err, allContents){
        if(err){
            console.log(err);
        } else{
            Content.find({name: regex}).count().exec(function(err, count){
                if(err) {
                    console.log(err);
                } else {
                    if(allContents.length <1 ) {
                        noMatch = "Nothing found, please try again.";
                    } 

                    res.render('contents/index', {
                        contents: allContents, 
                        noMatch: noMatch,
                        current: page,    
                        pages: Math.ceil(count / perPage),
                        url: req.url
                    });
                }
            });
        }
    })
     
});

router.post('/', function(req,res){

	var name = req.body.name;
	var image = req.body.image;
    var videoParse = urlParser.parse(req.body.video);
    var video = {
        url: req.body.video,
        provider: videoParse.provider,
        id: videoParse.id
        };
    var category = req.body.category;
	var desc = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
    var likes = 0;
    var timeNow = moment();
	var newContent = {
        name: name, 
        image: image, 
        video: video, 
        category: category, 
        description: desc, 
        author:author, 
        likes: likes, 
        createdAt: timeNow
    }
    // Create a new content and save to DB
    Content.create(newContent, function(err, newContent){
        if(err){
            console.log(err);
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            //redirect back to campgrounds page
            console.log(newContent);
            User.findById(req.user._id, function(err, foundUser) {
                if(err){
                    console.log(err);
                } else {
                    foundUser.lastActiveTime = timeNow;
                }

            })
            res.redirect("/contents");
        }
    });
});

//======== LIKE and UNLIKE ========
router.post("/:id", function (req, res) {
    Content.findById(req.params.id, function (err, foundContent) {
        if (err) {
            console.log(err);
        } else { 
            
            User.findById(req.user._id, function(err, foundUser) {
                if (err) {
                    console.log(err);
                } else {
                    if (foundUser.contentLiked.indexOf(foundContent._id) != -1) {
                        
                        foundContent.likes -= 1;
                        foundContent.save();

                        foundUser.contentLiked.pull(foundContent._id);
                        foundUser.save();

                        req.flash("error","Successfully Unliked!");
                        res.redirect("back");

                    } else {
                        foundContent.likes += 1;
                        foundContent.save();

                        foundUser.contentLiked.push(foundContent._id);
                        foundUser.save();

                        req.flash("success","Successfully Liked!");
                        res.redirect("back");
                    }
                }
            });
        }
    });
});

router.get("/new", middleware.authCheck, function(req, res){
   	res.render("contents/new"); 
});

router.get("/:id", function(req, res){

    Content.findById(req.params.id, function(err, foundContent){
        if (err){
            console.log(err);
        } else{
            var sideContentsArray = [];
            var ctg = foundContent.category;
            var sidescroll = []

            Content.find({category: ctg}).sort({"createdAt": -1}).limit(3).exec(function(err, foundSideContents){
                if(err){
                    console.log(err);
                } else{
                    User.findById(foundContent.author.id, function(err, foundUser){
                    if(err){
                        console.log(err);
                    } else{
                        res.render("contents/show", 
                            {shortname: configDB.shortname,
                             sideContents: foundSideContents,
                             content: foundContent,
                             olouser: foundUser,
                             sidescrollinfinite: sidescroll,
                             url: req.url
                            });
                        }
                    })
                }
            })
        }
    })
    
    //find the campground with provided ID
    Content.findById(req.params.id).populate("comments").exec(function(err, foundContent){
        if(err){
            console.log(err);
        } else {
            console.log(foundContent);
            

            // User.findById(req.user.id, function(err, foundUser) )
            
            // res.render("contents/show", {content: foundContent, ffoundComment: []});

            // if (foundContent.comments) {
            //     foundContent.comments.forEach(function(err, comment){
            //         if(err) {
            //             console.log(err);
            //         } else {
            //             Comment.findById(comment._id).populate("comments").exec(function(err, foundComment){
            //                 if(err){
            //                     console.log(err);

            //                 } else {
            //                     console.log(foundComment);
            //                     var foundCommentList = [];
            //                     foundCommentList.push(foundComment);

            //                     res.render("contents/show", {content: foundContent, ffoundComment: foundCommentList});
            //                 }
            //             })
            //         }

            //     })
            // }
        }
    });
});

// router.get("/:id", function(req, res){

//     Content.findById(req.params.id, function(err, foundContent){
//         if (err){
//             console.log(err);
//         } else{
//             var sideContentsArray = [];
//             var ctg = foundContent.category;
//             foundSideContents = Content.find({category: ctg}).limit(3);

//             User.findById(foundContent.author.id, function(err, foundUser){
//             if(err){
//                 console.log(err);
//             } else{
//                 res.render("contents/show", 
//                     {shortname: configDB.shortname,
//                      sideContents: foundSideContents,
//                      content: foundContent,
//                      olouser: foundUser
//                     });
//                 }
//             })
//         }
//     })
    
//     //find the campground with provided ID
//     Content.findById(req.params.id).populate("comments").exec(function(err, foundContent){
//         if(err){
//             console.log(err);
//         } else {
//             console.log(foundContent);
            

//             // User.findById(req.user.id, function(err, foundUser) )
            
//             // res.render("contents/show", {content: foundContent, ffoundComment: []});

//             // if (foundContent.comments) {
//             //     foundContent.comments.forEach(function(err, comment){
//             //         if(err) {
//             //             console.log(err);
//             //         } else {
//             //             Comment.findById(comment._id).populate("comments").exec(function(err, foundComment){
//             //                 if(err){
//             //                     console.log(err);

//             //                 } else {
//             //                     console.log(foundComment);
//             //                     var foundCommentList = [];
//             //                     foundCommentList.push(foundComment);

//             //                     res.render("contents/show", {content: foundContent, ffoundComment: foundCommentList});
//             //                 }
//             //             })
//             //         }

//             //     })
//             // }
//         }
//     });
// });

router.get("/:id/edit", middleware.checkUserContent, function(req, res){
    console.log("IN EDIT!");
    //find the campground with provided ID
    Content.findById(req.params.id, function(err, foundContent){
        if(err){
            console.log(err);
        } else {
            //render show template with that campground
            res.render("contents/edit", {content: foundContent});
        }
    });
});

router.put("/:id", function(req, res){
    var newData = {name: req.body.name, image: req.body.image, video: req.body.video, category: req.body.category, description: req.body.description};
    Content.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, content){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/contents/" + content._id);
        }
    });
});

router.delete("/:id", function(req, res){
    Content.findByIdAndRemove(req.params.id, function(err){
        if(err){
          console.log("PROBLEM Delete Operation");
        } else {
          res.redirect("/contents");
        }
    })
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
