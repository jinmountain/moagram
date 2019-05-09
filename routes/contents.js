// ======== npm ========
const express = require('express');
const router = express.Router();
const passport = require('passport');
const moment = require('moment');
const urlParser = require('js-video-url-parser');
const querystring = require('querystring');
const clipboardy = require('clipboardy');

// ======== routes ========
const Content = require('../models/content');
const User    = require("../models/user"); 

const profile = require("./profile");
const middleware = require("../middleware");
const configDB = require('../config/keys.js');

//find every content
router.get('/', middleware.authCheck, (req, res, next) => {
    var noMatch = null;
    var perPage = 12;
    var page = req.query.page || 1;

    if(req.query.search){
        const nameRegex = new RegExp(escapeRegex(req.query.search), 'gi');
        const usernameRegex = new RegExp(escapeRegex(req.query.search), 'gi');

        Content.find({
            "$or": [{
                name: nameRegex
            }, {
                "author.username": usernameRegex
            }]
        })
        .sort({"createdAt": -1})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec(function(err, allContents){
            if(err){
                err.httpStatusCode = 500
                return next(err);
            } else {
                Content.find({
                    "$or": [{
                        name: nameRegex
                    }, {
                        "author.username": usernameRegex
                    }]
                })
                .count().exec(function(err, count){
                    if(err) {
                        err.httpStatusCode = 500
                        return next(err);
                    } else {
                        if(allContents.length <1 ) {
                            noMatch = "Don't let what you saw disappear. Share with Others";
                        } 

                        Content.find({})
                        .sort({"hotness": -1})
                        .limit(5)
                        .exec(function(err, foundSideContents){
                            if(err){
                                err.httpStatusCode = 500
                                return next(err);
                            } else {
                                res.render(req.user.lang + '/contents/index', {
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
    } else {
        Content.find({})
        .sort({"createdAt": -1})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec(function(err, allContents){
            if(err){
                err.httpStatusCode = 500
                return next(err);
            } else {
                Content.count().exec(function(err, count){
                    if(err) {
                        err.httpStatusCode = 500
                        return next(err);
                    } else {
                        if(allContents.length <1 ) {
                            noMatch = "Don't let what you saw disappear. Share with Others";
                        } 

                        Content.find({})
                        .sort({"hotness": -1})
                        .limit(5)
                        .exec(function(err, foundSideContents){
                            if(err){
                                err.httpStatusCode = 500
                                return next(err);
                            } else {
                                res.render(req.user.lang + '/contents/index', {
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
        });
    }
});

router.get("/new", middleware.authCheck, (req, res) => {
    var paste = clipboardy.readSync();
    var videoParse = urlParser.parse(paste);

    var pst = "";
    var pvd = "";
    
    if(paste != undefined){
        if(videoParse != undefined){
            pst = paste;
            pvd = videoParse.provider;
        } else {
            pst = paste;
            pvd = ""
        }
    } else {
        pst = "";
        pvd = "";
    }
    res.render(req.user.lang + "/contents/new", {
        paste: pst,
        provider: pvd 
    });
});

//Find all contents within the selected category
router.get('/category/:category', middleware.authCheck, (req, res) => {
    var noMatch = null;
    var perPage = 12;
    var page = req.query.page || 1;
    var count;

    // Search with category
    
    const ctg = req.params.category;
    
    if(req.query.search){
        const nameRegex = new RegExp(escapeRegex(req.query.search), 'gi');

        Content.find({
            category: ctg,
            name: nameRegex
        })
        .sort({"createdAt": -1})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec(function(err, allContents){
            if(err){
                console.log(err);
            } else { 
                Content.find({
                    category: ctg,
                    name: nameRegex
                }).count().exec(function(err, count){
                    if(err) {
                        console.log(err);
                    } else {
                        if(allContents.length <1 ) {
                            noMatch = "Don't let what you saw disappear. Share with Others";
                        } 
                        Content.find({category: ctg})
                        .sort({"hotness": -1})
                        .limit(5)
                        .exec(function(err, foundSideContents){
                            if(err){
                                console.log(err);
                            } else {
                                res.render(req.user.lang + '/contents/index', {
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
    } else {
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
                            noMatch = "Don't let what you saw disappear. Share with Others";
                        } 

                        Content.find({category: ctg})
                        .sort({"hotness": -1})
                        .limit(5)
                        .exec(function(err, foundSideContents){
                            if(err){
                                console.log(err);
                            } else {
                                res.render(req.user.lang + '/contents/index', {
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
        });
    }     
});

//find contents that match the inserted search query
// router.get('/search/:search', middleware.authCheck, (req, res) => {
//     var noMatch = null;
//     var perPage = 9;
//     var page = req.query.page || 1;
//     var count;

//     // Search with name
    
//     const regex = new RegExp(escapeRegex(req.params.search), 'gi');

//     // Get all contentes from DB
//     Content.find({name: regex})
//     .sort({"createdAt": -1})
//     .skip((perPage * page) - perPage)
//     .limit(perPage)
//     .exec(function(err, allContents){
//         if(err){
//             console.log(err);
//         } else{
//             Content.find({name: regex}).count().exec(function(err, count){
//                 if(err) {
//                     console.log(err);
//                 } else {
//                     if(allContents.length <1 ) {
//                         noMatch = "Don't let what you saw disappear. Share with Others";
//                     } 

//                     Content.find({})
//                     .sort({"hotness": -1})
//                     .limit(3)
//                     .exec(function(err, foundSideContents){
//                         if(err){
//                             console.log(err);
//                         } else {
//                             res.render(req.user.lang + '/contents/index', {
//                                 contents: allContents, 
//                                 noMatch: noMatch,
//                                 current: page,    
//                                 pages: Math.ceil(count / perPage),
//                                 url: req.url,
//                                 sideContents: foundSideContents
//                             });   
//                         }
//                     });
//                 }
//             });
//         }
//     })
// });

//found popular contents
router.get('/popular', middleware.authCheck, (req, res) => {
    var noMatch = null;
    var perPage = 12;
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
                        noMatch = "Don't let what you saw disappear. Share with Others";
                    } 

                    Content.find({})
                    .sort({"hotness": -1})
                    .limit(5)
                    .exec(function(err, foundSideContents){
                        if(err){
                            console.log(err);
                        } else {
                            res.render(req.user.lang + '/contents/index', {
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
        var video = {
            url: '',
            provider: '',
            id: ''
        }
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
    Content.create(newContent, function(err, newContent, next){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            //redirect back to campgrounds page
            console.log(newContent);
            User.findById(req.user._id, function(err, foundUser) {
                if(err){
                    err.httpStatusCode = 500
                    return next(err);
                } else {
                    //when a user load a post it will update its 
                    //last active time to the current time
                    foundUser.lastActiveTime = dateNow;
                    foundUser.save();

                    //push the content id to user's content created database
                    foundUser.contentCreated.push(newContent._id);    
                    foundUser.save();
                }
            });
            res.redirect('/' + req.user.lang + "/contents");
        }
    });
});

//======== LIKE and UNLIKE ========
router.post("/:id", function (req, res, next) {

    var dateNow = moment();

    Content.findById(req.params.id, function (err, foundContent) {
        if (err) {
            err.httpStatusCode = 500
            return next(err);
        } else { 
            User.findById(req.user._id, function(err, foundUser) {
                if (err) {
                    err.httpStatusCode = 500
                    return next(err);
                } else {
                    if (foundUser.contentLiked.indexOf(foundContent._id) != -1) {
                        
                        foundContent.likes -= 1;
                        
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

                        req.flash("error","Unliked " + foundContent.name);
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

                        req.flash("success","Liked " + foundContent.name);
                        res.redirect("back");
                    }
                }
            });
        }
    });
});

router.get("/:id", middleware.authCheck, function(req, res, next){
    Content.findById(req.params.id, function(err, foundContent){
        if (err){
            err.httpStatusCode = 500
            return next(err);
        } else {
            User.findById(req.user._id, function(err, foundUser) {
                if (err) {
                    err.httpStatusCode = 500
                    return next(err);
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
                            err.httpStatusCode = 500;
                            return next(err);
                        } else if(contentAuthor == null){
                            req.flash("error", "The author is not found");
                            res.redirect("back");
                        } else {
                            //display contents with the same category on the side
                            var ctg = foundContent.category;
                            Content.find({category: ctg}).sort({"createdAt": -1}).limit(5).exec(function(err, foundSideContents){
                                if(err){
                                    console.log(err);
                                } else{
                                    
                                res.render(req.user.lang + "/contents/show", 
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
});

router.get("/:id/edit", middleware.checkUserContent, function(req, res){
    //find the content with the ID
    Content.findById(req.params.id, function(err, foundContent){
        if(err){
            err.httpStatusCode = 500;
            return next(err);
        } else {
            res.render(req.user.lang + "/contents/edit", {
                content: foundContent
            });
        }
    });
});

router.put("/:id", function(req, res){
    var videoParse = urlParser.parse(req.body.video);

    if(videoParse != undefined){
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
    } else {
        var newData = {
            name: req.body.name, 
            image: req.body.image, 
            video: {
                url: "",
                provider: "",
                id: ""
                }, 
            category: req.body.category, 
            description: req.body.description
        };
    }

    Content.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, content){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.user.lang == 'en'){
                req.flash("success", "Updated " + content.name);
            } else if (req.user.lang == 'ko'){
                req.flash("success", content.name + " 업데이트 완료");
            } else {
                req.flash("success", "Updated " + content.name);
            }
            
            res.redirect("/" + req.user.lang + "/contents/" + content._id);
        }
    });
});

router.delete("/:id", function(req, res, next){
    Content.findByIdAndRemove(req.params.id, function(err){
        if (err) {
            err.httpStatusCode = 500
            return next(err);
        } else {
            res.redirect("/" + req.user.lang + "/contents");
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

router.use((err, req, res, next) => {
    if(err.httpStatusCode == "500"){
        res.status(err.httpStatusCode).render('./error', {
            err: "500",
            message: "Oops. Internal Server Error"
        });
    } else if(err.httpStatusCode == "403"){
        res.status(err.httpStatusCode).render('./error', {
            err: "403",
            message: "Oops. Access not allowed"
        });
    } else if(err.httpStatusCode == "400"){
        res.status(err.httpStatusCode).render('./error', {
            err: "400",
            message: "Oops. Something went wrong"
        });
    } else if(err.httpStatusCode == "401"){
        res.status(err.httpStatusCode).render('./error', {
            err: "401",
            message: "Access Unauthorized"
        });
    } else if(err.httpStatusCode == "404"){
        res.status(err.httpStatusCode).render('./error', {
            err: "404",
            message: "Oops. Page not found"
        });
    } else {
        res.status(err.httpStatusCode).render('./error', {
            err: "",
            message: "Oops. Something went wrong"
        });
    }
});

module.exports = router;
