// ======== npm ========
const express = require('express');
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const router = express.Router();
const passport = require('passport');
const moment = require('moment');
const urlParser = require('js-video-url-parser');

// ======== routes ========
const Content = require('../models/content');
const User    = require("../models/user"); 
const Comment = require("../models/comment"); 

const profile = require("./profile");
const middleware = require("../middleware");
const configDB = require('../config/keys.js');

// =======================================================
// Count total the number of contents in each ctg
// Count newly the number of upadated contents in Each ctg
// =======================================================
function ctgCount(ctgCountArray, totalCtgCountArray) {
    var contentCtg = ["tntl", "mukbang", "news", "documentary", 
                    "educational", "fitness", "motivational", "music",
                    "beauty", "gaming", "vlog", "animal", "others"];

    var end = Date.now();
    var contentCreatedToday = end - 86400000 // 24hours;

    contentCtg.forEach(function(ctg, i, array) {
        Content.countDocuments({
            category: ctg,
        }, function(err, count){
            if(err){
                err.httpStatusCode = 500
                return next(err);
            } else {
                totalCtgCountArray.splice(i, 1, count);
            }
        });

        Content.countDocuments({
            category: ctg,
            createdAt: {$gt: contentCreatedToday}
        }, function(err, count){
            if(err){
                err.httpStatusCode = 500
                return next(err);
            } else {
                ctgCountArray.splice(i, 1, count);
            }
        });
    });
}

var ctgCountArray = [];
var totalCtgCountArray = [];

//find every content
router.get('/', (req, res, next) => {

    var noMatch = null;
    var perPage = 12;
    var page = req.query.page || 1;

    var ctgQuery = req.query.category;
    var searchQuery = req.query.search;
    var sortQuery = req.query.sort;
    var pageQuery = req.query.page;

    console.log(" |" + ctgQuery + " |" + sortQuery + " |" + searchQuery);
    
    var theFiveHots = [];

    var errorMessage = "Sorry, We can't process your following request.";

    // =========FIND THE TOP 5 CONTENTS========
    function findTopContents(category) {
        if(category != undefined){
            Content.find({category: category})
            .sort({"hotness": -1}).limit(5)
            .exec(function(err, theHottestFound){
                if(err){
                    res.render('./error', {
                        err: err,
                        message: errorMessage,
                        section: "C1"
                    });
                } else {
                    if(theHottestFound.length < 1){
                        theFiveHots = [];
                    } else {
                        theFiveHots = theHottestFound;
                    }
                }
            });
        } else {
            Content.find({})
            .sort({"hotness": -1}).limit(5)
            .exec(function(err, theHottestFound){
                if(err){
                    err.httpStatusCode = 500
                    return next(err);
                } else {
                    if(theHottestFound.length < 1){
                        theFiveHots = [];
                    } else {
                        theFiveHots = theHottestFound;
                    }
                }
            });
        }
    }
    //======LANGUAGE AND PAGEQUERY=====
    var lang;
    if(req.user){
        lang = req.user.lang;
    } else {
        lang = moment.locale();
    }

    //======Determine Whether First Page or Not======
    var pageQueryRoute;
    if(pageQuery != undefined){
        pageQueryRoute = '/contents/contentBox'
    } else {
        pageQueryRoute = '/contents/index'
    }

    //Used ctgCount and findTopContents Functions
    ctgCount(ctgCountArray, totalCtgCountArray);
    findTopContents(ctgQuery);

    // Possible Queries for Get Content
    // ctg |  sort  | search
    // ======================
    //   o |    o   | o
    //   o |    o   | x
    //   o |    x   | o
    //   o |    x   | x
    //   
    //   x |    o   | o
    //   x |    o   | x
    //   x |    x   | o
    //   x |    x   | x
     
    if(ctgQuery != undefined){
        if(sortQuery != undefined && sortQuery == 'popular'){
            if(searchQuery != undefined){
                const nameRegex = new RegExp(escapeRegex(req.query.search), 'gi');
                const usernameRegex = new RegExp(escapeRegex(req.query.search), 'gi');

                Content.find({
                    "category": ctgQuery,
                    "$or": [{
                        name: nameRegex
                    }, {
                        "author.username": usernameRegex
                    }]
                })
                .sort({"hotness": -1})
                .skip((perPage * page) - perPage)
                .limit(perPage)
                .exec(function(err, allContents){
                    if(err){
                        res.render('./error', {
                            err: err,
                            message: errorMessage,
                            section: "C1"
                        });
                    } else {
                        Content.find({
                            category: ctgQuery,
                            "$or": [{
                                name: nameRegex
                            }, {
                                "author.username": usernameRegex
                            }]
                        }).count().exec(function(err, count){
                            if(err) {
                                res.render('./error', {
                                    err: err,
                                    message: errorMessage,
                                    section: "C2"
                                });
                            } else {
                                if(allContents.length <1 ) {
                                    noMatch = "Don't let what you saw disappear. Share with us!";
                                }
                                res.render(lang + pageQueryRoute, {
                                    pageType: 'index',
                                    ctg: ctgQuery,
                                    search: searchQuery,
                                    sort: sortQuery,
                                    count: count,
                                    contents: allContents,
                                    topContent: theFiveHots,

                                    noMatch: noMatch,
                                    current: page,    
                                    pages: Math.ceil(count / perPage),

                                    url: req.url,
                                    sideContents: theFiveHots,
                                    ctgCount: ctgCountArray,
                                    totalCtgCount :totalCtgCountArray
                                });
                            }
                        });
                    }
                });
            } else {
                Content.find({
                    "category": ctgQuery
                })
                .sort({"hotness": -1})
                .skip((perPage * page) - perPage)
                .limit(perPage)
                .exec(function(err, allContents){
                    if(err){
                        res.render('./error', {
                            err: err,
                            message: errorMessage,
                            section: "C3"
                        });
                    } else {
                        Content.find({
                            "category": ctgQuery
                        })
                        .count().exec(function(err, count){
                            if(err) {
                                res.render('./error', {
                                    err: err,
                                    message: errorMessage,
                                    section: "C4"
                                });
                            } else {
                                if(allContents.length <1 ) {
                                    noMatch = "Don't let what you saw disappear. Share with us!";
                                } 
                                res.render(lang + pageQueryRoute, {
                                    pageType: 'index',
                                    ctg: ctgQuery,
                                    search: "",
                                    sort: sortQuery,
                                    count: count,
                                    contents: allContents,
                                    topContent: theFiveHots,

                                    noMatch: noMatch,
                                    current: page,    
                                    pages: Math.ceil(count / perPage),

                                    url: req.url,
                                    sideContents: theFiveHots,
                                    ctgCount: ctgCountArray,
                                    totalCtgCount :totalCtgCountArray
                                });
                            }
                        });
                    }
                });
            }    
        } else {
            if(searchQuery != undefined){
                const nameRegex = new RegExp(escapeRegex(req.query.search), 'gi');
                const usernameRegex = new RegExp(escapeRegex(req.query.search), 'gi');

                Content.find({
                    "category": ctgQuery,
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
                        res.render('./error', {
                            err: err,
                            message: errorMessage,
                            section: "C5"
                        });
                    } else {
                        Content.find({
                            "category": ctgQuery,
                            "$or": [{
                                name: nameRegex
                            }, {
                                "author.username": usernameRegex
                            }]
                        })
                        .count().exec(function(err, count){
                            if(err) {
                                res.render('./error', {
                                    err: err,
                                    message: errorMessage,
                                    section: "C6"
                                });
                            } else {
                                if(allContents.length <1 ) {
                                    noMatch = "Don't let what you saw disappear. Share with us!";
                                }
                                res.render(lang + pageQueryRoute, {
                                    pageType: 'index',
                                    ctg: ctgQuery,
                                    search: searchQuery,
                                    sort: 'new',
                                    count: count,
                                    contents: allContents,
                                    topContent: theFiveHots,

                                    noMatch: noMatch,
                                    current: page,    
                                    pages: Math.ceil(count / perPage),

                                    url: req.url,
                                    sideContents: theFiveHots,
                                    ctgCount: ctgCountArray,
                                    totalCtgCount :totalCtgCountArray
                                });
                            }
                        });
                    }
                });
            } else {
                Content.find({"category": ctgQuery})
                .sort({"createdAt": -1})
                .skip((perPage * page) - perPage)
                .limit(perPage)
                .exec(function(err, allContents){
                    if(err){
                        res.render('./error', {
                            err: err,
                            message: errorMessage,
                            section: "C7"
                        });
                    } else {
                        Content.find({"category": ctgQuery})
                        .count().exec(function(err, count){
                            if(err) {
                                res.render('./error', {
                                    err: err,
                                    message: errorMessage,
                                    section: "C8"
                                });
                            } else {
                                if(allContents.length <1 ) {
                                    noMatch = "Don't let what you saw disappear. Share with us!";
                                }
                                res.render(lang + pageQueryRoute, {
                                    pageType: 'index',
                                    ctg: ctgQuery,
                                    search: "",
                                    sort: 'new',
                                    count: count,
                                    contents: allContents,
                                    topContent: theFiveHots,

                                    noMatch: noMatch,
                                    current: page,    
                                    pages: Math.ceil(count / perPage),

                                    url: req.url,
                                    sideContents: theFiveHots,
                                    ctgCount: ctgCountArray,
                                    totalCtgCount :totalCtgCountArray
                                });
                            }
                        });
                    }
                });
            } 
        }
    } else {
        if(sortQuery != undefined && sortQuery == 'popular'){
            if(searchQuery != undefined){
                const nameRegex = new RegExp(escapeRegex(req.query.search), 'gi');
                const usernameRegex = new RegExp(escapeRegex(req.query.search), 'gi');

                Content.find({
                    "$or": [{
                        name: nameRegex
                    }, {
                        "author.username": usernameRegex
                    }]
                })
                .sort({"hotness": -1})
                .sort({"createdAt": -1})
                .skip((perPage * page) - perPage)
                .limit(perPage)
                .exec(function(err, allContents){
                    if(err){
                        res.render('./error', {
                            err: err,
                            message: errorMessage,
                            section: "C9"
                        });
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
                                res.render('./error', {
                                    err: err,
                                    message: errorMessage,
                                    section: "C10"
                                });
                            } else {
                                if(allContents.length <1 ) {
                                    noMatch = "Don't let what you saw disappear. Share with us!";
                                }
                                res.render(lang + pageQueryRoute, {
                                    pageType: 'index',
                                    ctg: "",
                                    search: searchQuery,
                                    sort: sortQuery,
                                    count: count,
                                    contents: allContents,
                                    topContent: theFiveHots,

                                    noMatch: noMatch,
                                    current: page,    
                                    pages: Math.ceil(count / perPage),

                                    url: req.url,
                                    sideContents: theFiveHots,
                                    ctgCount: ctgCountArray,
                                    totalCtgCount :totalCtgCountArray
                                });
                            }
                        });
                    }
                });
            } else {
                Content.find({})
                .sort({"hotness": -1})
                .sort({"createdAt": -1})
                .skip((perPage * page) - perPage)
                .limit(perPage)
                .exec(function(err, allContents){
                    if(err){
                        res.render('./error', {
                            err: err,
                            message: errorMessage,
                            section: "C11"
                        });
                    } else {
                        Content.find({})
                        .count().exec(function(err, count){
                            if(err) {
                                res.render('./error', {
                                    err: err,
                                    message: errorMessage,
                                    section: "C12"
                                });
                            } else {
                                if(allContents.length <1 ) {
                                    noMatch = "Don't let what you saw disappear. Share with us!";
                                }
                                res.render(lang + pageQueryRoute, {
                                    pageType: 'index',
                                    ctg: "",
                                    search: "",
                                    sort: sortQuery,
                                    count: count,
                                    contents: allContents,
                                    topContent: theFiveHots,

                                    noMatch: noMatch,
                                    current: page,    
                                    pages: Math.ceil(count / perPage),

                                    url: req.url,
                                    sideContents: theFiveHots,
                                    ctgCount: ctgCountArray,
                                    totalCtgCount :totalCtgCountArray
                                });
                            }
                        });
                    }
                });
            }    
        } else {
            if(searchQuery != undefined){
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
                        res.render('./error', {
                            err: err,
                            message: errorMessage,
                            section: "C13"
                        });
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
                                res.render('./error', {
                                    err: err,
                                    message: errorMessage,
                                    section: "C14"
                                });
                            } else {
                                if(allContents.length <1 ) {
                                    noMatch = "Don't let what you saw disappear. Share with us!";
                                }
                                res.render(lang + pageQueryRoute, {
                                    pageType: 'index',
                                    ctg: "",
                                    search: searchQuery,
                                    sort: 'new',
                                    count: count,
                                    contents: allContents,
                                    topContent: theFiveHots,

                                    noMatch: noMatch,
                                    current: page,    
                                    pages: Math.ceil(count / perPage),

                                    url: req.url,
                                    sideContents: theFiveHots,
                                    ctgCount: ctgCountArray,
                                    totalCtgCount :totalCtgCountArray
                                });
                            }
                        });
                    }
                });
            } else {
                Content.find({})
                .sort({"createdAt": -1})
                .skip((perPage * page) - perPage)
                .limit(perPage)
                .exec(function(err, allContents){
                    if(err){
                        res.render('./error', {
                            err: err,
                            message: errorMessage,
                            section: "C15"
                        });
                    } else {
                        Content.find({})
                        .count().exec(function(err, count){
                            if(err) {
                                res.render('./error', {
                                    err: err,
                                    message: errorMessage,
                                    section: "C16"
                                });
                            } else {
                                if(allContents.length <1 ) {
                                    noMatch = "Don't let what you saw disappear. Share with us!";
                                }
                                res.render(lang + pageQueryRoute, {
                                    pageType: 'index',
                                    ctg: "",
                                    search: "",
                                    sort: 'new',
                                    count: count,
                                    contents: allContents,
                                    topContent: theFiveHots,

                                    noMatch: noMatch,
                                    current: page,    
                                    pages: Math.ceil(count / perPage),

                                    url: req.url,
                                    sideContents: theFiveHots,
                                    ctgCount: ctgCountArray,
                                    totalCtgCount :totalCtgCountArray
                                });
                            }
                        });
                    }
                });
            } 
        }
    }
});

router.get("/new", middleware.authCheck, (req, res) => {

    ctgCount(ctgCountArray, totalCtgCountArray);

    res.render(req.user.lang + "/contents/new", {
        pageType: 'new',
        ctgCount: ctgCountArray,
        totalCtgCount :totalCtgCountArray
    });
});


router.post('/', middleware.authCheck, function(req, res){

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
            res.redirect('/contents/' + newContent.id);
        }
    });
});

router.get("/:id", middleware.authCheck, function(req, res, next){
    
    //======LANGUAGE AND PAGEQUERY=====
    var lang;
    if(req.user){
        lang = req.user.lang;
    } else {
        lang = moment.locale();
    }

    var perPage = 12;
    var page = req.query.page || 1;

    var errorMessage = "Sorry, We can't process your following request.";

    ctgCount(ctgCountArray, totalCtgCountArray);

    if(req.query.page){
        Content.findById(req.params.id, function(err, foundContent){
            if (err){
                res.render('./error', {
                    err: err,
                    message: errorMessage,
                    section: "D1"
                });
            } else {
                User.findById(req.user._id, function(err, foundUser) {
                    if (err) {
                        res.render('./error', {
                            err: err,
                            message: errorMessage,
                            section: "D2"
                        });
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
                                res.render('./error', {
                                    err: err,
                                    message: errorMessage,
                                    section: "D3"
                                });
                            } else if(contentAuthor == null){
                                req.flash("error", "The author is not found");
                                res.redirect("back");
                            } else {
                                //display contents with the same category on the side
                                var ctg = foundContent.category;
                                Content.find({category: ctg}).sort({"createdAt": -1}).limit(5).exec(function(err, foundSideContents){
                                    if(err){
                                        res.render('./error', {
                                            err: err,
                                            message: errorMessage,
                                            section: "D4"
                                        });
                                    } else{
                                        Comment.find({contentId: req.params.id})
                                        .sort({"createdAt": -1})
                                        .skip((perPage * page) - perPage)
                                        .limit(perPage)
                                        .exec(function(err, comments){
                                            if(err){
                                                res.render('./error', {
                                                    err: err,
                                                    message: errorMessage,
                                                    section: "D5"
                                                });
                                            } else {
                                                Comment.find({contentId: req.params.id}).count().exec(function(err, commentCount){
                                                    if(err){
                                                        res.render('./error', {
                                                            err: err,
                                                            message: errorMessage,
                                                            section: "D6"
                                                        });
                                                    } else {
                                                        res.render(req.user.lang + "/contents/commentBox", 
                                                        {
                                                            pageType: 'show',
                                                            sideContents: foundSideContents,
                                                            content: foundContent,
                                                            olouser: foundUser,
                                                            url: req.url,
                                                            contentAuthor: contentAuthor,
                                                            ctgCount: ctgCountArray,
                                                            totalCtgCount :totalCtgCountArray,

                                                            current: page,    
                                                            pages: Math.ceil(commentCount / perPage),
                                                            comments: comments,
                                                            commentCount: commentCount
                                                        });
                                                    }
                                                })
                                                
                                            }
                                        })
                                    }
                                });
                            }
                        }) 
                    }
                });
            }
        });
    } else {
        Content.findById(req.params.id, function(err, foundContent){
            if (err){
                res.render('./error', {
                    err: err,
                    message: errorMessage,
                    section: "D7"
                });
            } else {
                User.findById(req.user._id, function(err, foundUser) {
                    if (err) {
                        res.render('./error', {
                            err: err,
                            message: errorMessage,
                            section: "D8"
                        });
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
                                res.render('./error', {
                                    err: err,
                                    message: errorMessage,
                                    section: "D9"
                                });
                            } else if(contentAuthor == null){
                                req.flash("error", "The author is not found");
                                res.redirect("back");
                            } else {
                                //display contents with the same category on the side
                                var ctg = foundContent.category;
                                Content.find({category: ctg}).sort({"createdAt": -1}).limit(5).exec(function(err, foundSideContents){
                                    if(err){
                                        res.render('./error', {
                                            err: err,
                                            message: errorMessage,
                                            section: "D10"
                                        });
                                    } else{
                                        Comment.find({contentId: req.params.id})
                                        .sort({"createdAt": -1})
                                        .skip((perPage * page) - perPage)
                                        .limit(perPage)
                                        .exec(function(err, comments){
                                            if(err){
                                                res.render('./error', {
                                                    err: err,
                                                    message: errorMessage,
                                                    section: "D11"
                                                });
                                            } else {
                                                Comment.find({contentId: req.params.id}).count().exec(function(err, commentCount){
                                                    if(err){
                                                        res.render('./error', {
                                                            err: err,
                                                            message: errorMessage,
                                                            section: "D12"
                                                        });
                                                    } else {
                                                        res.render(req.user.lang + "/contents/show", 
                                                        {
                                                            pageType: 'show',
                                                            sideContents: foundSideContents,
                                                            content: foundContent,
                                                            olouser: foundUser,
                                                            url: req.url,
                                                            contentAuthor: contentAuthor,
                                                            ctgCount: ctgCountArray,
                                                            totalCtgCount :totalCtgCountArray,


                                                            current: page,    
                                                            pages: Math.ceil(commentCount / perPage),
                                                            comments: comments,
                                                            commentCount: parseInt(commentCount)
                                                        });
                                                    }
                                                })
                                                
                                            }
                                        })
                                    }
                                });
                            }
                        }) 
                    }
                });
            }
        });
    }
});

router.get("/:id/edit", middleware.checkUserContent, function(req, res){

    ctgCount(ctgCountArray, totalCtgCountArray);

    //======LANGUAGE AND PAGEQUERY=====
    var lang;
    if(req.user){
        lang = req.user.lang;
    } else {
        lang = moment.locale();
    }

    var errorMessage = "Sorry, We can't process your following request.";

    //find the content with the ID
    Content.findById(req.params.id, function(err, foundContent){
        if(err){
            res.render('./error', {
                err: err,
                message: errorMessage,
                section: "D13"
            });
        } else {
            res.render(req.user.lang + "/contents/edit", {
                pageType: 'edit',
                content: foundContent,
                ctgCount: ctgCountArray,
                totalCtgCount :totalCtgCountArray
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
            if(req.user){
                if (req.user.lang == 'en'){
                    req.flash("success", "Updated " + content.name);
                } else if (req.user.lang == 'ko'){
                    req.flash("success", content.name + " ???????????? ??????");
                } else {
                    req.flash("success", "Updated " + content.name);
                }
                
                res.redirect("/contents/" + content._id);
            } else {
                res.redirect("/auth/login");
            }
        }
    });
});

router.delete("/:id", middleware.checkUserContent, function(req, res, next){
    Content.findByIdAndRemove(req.params.id, function(err){
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if(req.user){
                res.redirect("/contents"); 
            } else {
                res.redirect("/auth/login");
            }
        }
    });
});

router.get("/:contentId/:commentId", middleware.authCheck, function(req, res, next){
    var page = req.query.page || 1;
    var perPage = 10;
    var pages;
    var buttonSwitch = true; 
    var nextPage = parseInt(page) + 1;

    //======LANGUAGE AND PAGEQUERY=====
    var lang;
    if(req.user){
        lang = req.user.lang;
    } else {
        lang = moment.locale();
    }

    commentReplies = [];
    
    var errorMessage = "Sorry, We can't process your following request.";

    Comment.findById(req.params.commentId, function(err, foundComment){
        if(err){
            res.render('./error', {
                err: err,
                message: errorMessage,
                section: "D14"
            });
        } else {
            var replyCount = foundComment.replies.length;
            commentReplies = foundComment.replies
            .sort(function(a, b) {
                return parseFloat(b.createdAt) - parseFloat(a.createdAt);
            })
            .slice((perPage * page) - perPage, (perPage * page));

            pages = Math.ceil(replyCount / perPage);

            if(page == pages){
                buttonSwitch = false;
            }

            res.render(req.user.lang + "/contents/replyBox", {
                commentId: req.params.commentId,
                count: replyCount,
                comment: foundComment,
                replies: commentReplies,
                current: page,
                perPage: perPage,    
                pages: pages,
                showButton: buttonSwitch,
                nextPage: nextPage 
            });
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;