
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


//find every content
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

                    Content.find({})
                    .sort({"hotness": -1})
                    .limit(3)
                    .exec(function(err, foundSideContents){
                        if(err){
                            console.log(err);
                        } else {
                            res.render('contents/index', {
                                contents: allContents,

                                noMatch: noMatch,
                                current: page,    
                                pages: Math.ceil(count / perPage),

                                url: req.url,
                                sideContents: foundSideContents
                            });
                        }
                    });
                }
            });
        }
	})
});

//Find all contents within the selected category
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

                    Content.find({category: ctg})
                    .sort({"hotness": -1})
                    .limit(3)
                    .exec(function(err, foundSideContents){
                        if(err){
                            console.log(err);
                        } else {
                            res.render('contents/index', {
                                contents: allContents, 
                                noMatch: noMatch,
                                current: page,    
                                pages: Math.ceil(count / perPage),
                                url: req.url,
                                sideContents: foundSideContents
                            });   
                        }
                    });
                }
            });
        }
    })
     
});

//find contents that match the inserted search query
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

                    Content.find({})
                    .sort({"hotness": -1})
                    .limit(3)
                    .exec(function(err, foundSideContents){
                        if(err){
                            console.log(err);
                        } else {
                            res.render('contents/index', {
                                contents: allContents, 
                                noMatch: noMatch,
                                current: page,    
                                pages: Math.ceil(count / perPage),
                                url: req.url,
                                sideContents: foundSideContents
                            });   
                        }
                    });
                }
            });
        }
    })
     
});

//found popular contents
router.get('/popular', middleware.authCheck, (req, res) => {
    var noMatch = null;
    var perPage = 9;
    var page = req.query.page || 1;

    Content.find({})
    .sort({"hotness": -1})
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

                    Content.find({})
                    .sort({"hotness": -1})
                    .limit(3)
                    .exec(function(err, foundSideContents){
                        if(err){
                            console.log(err);
                        } else {
                            res.render('contents/index', {
                                contents: allContents, 
                                noMatch: noMatch,
                                current: page,    
                                pages: Math.ceil(count / perPage),
                                url: req.url,
                                sideContents: foundSideContents
                            });   
                        }
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

    try {
        var video = {
            url: req.body.video,
            provider: videoParse.provider,
            id: videoParse.id
        }
    }
    catch(err) {
        var video = {}
    }

    var category = req.body.category;
	var desc = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username,
        thumbnail: req.user.thumbnail
	};
    var likes = 0;
    var views = 0;
    
    //javascript built in date to sort
    var timeNow = Date.now();
    //moment js to show date
    var dateNow = moment();

    var hottness = 0;

	var newContent = {
        name: name, 
        image: image, 
        video: video, 
        category: category, 
        description: desc, 
        author:author, 
        likes: likes, 
        createdAt: timeNow,
        date: dateNow,
        views: views,
        hottness: hottness
    }

    // Create a new content and save to DB
    Content.create(newContent, function(err, newContent){
        if(err){
            
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            //redirect back to campgrounds page
            console.log(newContent);
            User.findById(req.user._id, function(err, foundUser) {
                if(err){
                    console.log(err);
                } else {
                    //when a user load a post it will update its 
                    //last active time to the current time
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
                        
                        // every time someone like a post,
                        // the post is updated with newly calculated hotness
                        var dateNow = moment();
                        var now = moment(new Date()); //todays date
                        var end = moment(foundContent.createdAt); // another date
                        var duration = moment.duration(now.diff(end));
                        var hours = duration.asHours();
                        var growth = (foundContent.views*3) + (foundContent.likes*30);
                        var newHotness = (growth*30)/hours;
                        foundContent.hotness = newHotness;
                        //================================

                        foundContent.save();
                        

                        foundUser.contentLiked.pull(foundContent._id);
                        foundUser.save();

                        req.flash("error","Successfully Unliked!");
                        res.redirect("back");

                    } else {
                        foundContent.likes += 1;

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
            User.findById(req.user._id, function(err, foundUser) {
                if (err) {
                    console.log(err);
                } else {
                    //if the id of content is in the user's contentViewed list
                    //increase the view by 1
                    //============================================================
                    // if there is the content id in the user's contentViewed list
                    // don't add view count
                    if (foundUser.contentViewed.indexOf(foundContent._id) != -1) {
                        foundContent.views += 0;

                        // every time someone views a post,
                        // the post.hotness is updated with newly calculated hotness
                        var now = moment(new Date()); //todays date
                        var end = moment(foundContent.createdAt); // another date
                        var duration = moment.duration(now.diff(end));
                        var hours = duration.asHours();
                        var growth = (foundContent.views*3) + (foundContent.likes*30);
                        var newHotness = (growth*30)/hours;
                        foundContent.hotness = newHotness;
                        //================================
                        foundContent.save();

                    // if not, add view count by 1 
                    // and push the content id into the user's viewed list
                    } else {
                        foundContent.views += 1;

                        // every time someone views a post,
                        // the post.hotness is updated with newly calculated hotness
                        var now = moment(new Date()); //todays date
                        var end = moment(foundContent.createdAt); // another date
                        var duration = moment.duration(now.diff(end));
                        var hours = duration.asHours();
                        var growth = (foundContent.views*3) + (foundContent.likes*30);
                        var newHotness = (growth*30)/hours;
                        foundContent.hotness = newHotness;
                        //================================
                        foundContent.save();

                        foundUser.contentViewed.push(foundContent._id);
                        foundUser.save();
                    }

                    //find the author of the content to view one's followers
                    User.findById(foundContent.author.id, function(err, contentAuthor){
                        if(err) {
                            console.log(err);
                        } else {
                            //display contents with the same category on the side
                            var ctg = foundContent.category;
                            Content.find({category: ctg}).sort({"createdAt": -1}).limit(3).exec(function(err, foundSideContents){
                                if(err){
                                    console.log(err);
                                } else{
                                    
                                res.render("contents/show", 
                                    {shortname: configDB.shortname,
                                     sideContents: foundSideContents,
                                     content: foundContent,
                                     olouser: foundUser,
                                     url: req.url,
                                     contentAuthor: contentAuthor
                                    });
                                }
                            });
                        }
                    }) 
                }
            });
        }
    });
    
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
    
    var videoParse = urlParser.parse(req.body.video);

    var newData = {
        name: req.body.name, 
        image: req.body.image, 
        video: {
            url: req.body.video,
            provider: videoParse.provider,
            id: videoParse.id
            }, 
        category: req.body.category, 
        description: req.body.description
    };

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
