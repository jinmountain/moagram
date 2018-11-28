const express = require('express');
const router = express.Router();
const middleware = require("../middleware");
const Content = require('../models/content');
const User    = require("../models/user");

router.get('/', middleware.authCheck, (req, res) => {

	var request = "overview";
	var ids = req.user.contentLiked;
	var likeList = []; 
	var noContents = null;

	Content.find({_id: {$in: ids}}, function(err, likedContents){
        if(err){
            console.log(err);
        } else {
        	likeList = likedContents;
        }
    })

	User.findById(req.user._id, function(err, userFound){
		if(err){
			console.log(err);
		} else{
	        Content.find({'author.id': userFound._id}, function(err, myContents){
	        	if(err){
	        		console.log(err);
	        	} else{
	        		if(myContents < 1) {
	        			noContents = "Haven't shared anything yet";
	        		}
	        		res.render('profile', 
	        			{request: request,
	        			 contents: likeList,
	        			 user: userFound,
	        			 myContents: myContents,
	        			 noContents: noContents
	        			}
	        		);
	        	}
	        })
		}
	})   
});

router.get('/likes', middleware.authCheck, (req, res) => {

	var request= "contentsLiked";
	var ids = req.user.contentLiked;
	var likeList = []; 
	var noContents = null;

	//pagination
	var perPage = 16;
    var page = req.query.page || 1;


	Content.find({_id: {$in: ids}})
	.sort({"createdAt": -1})
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .exec(function(err, likedContents){
        if(err){
            console.log(err);
        } else {
        	Content.find({_id: {$in: ids}}).count().exec(function(err, count){
        		if(err) {
        			console.log(err);
        		} else {
        			if (likedContents < 1) {
		        		noContents = "Haven't liked any content";
		        	}
		        	res.render('profile', {
		        		request: request,
					 	contents: likedContents,
		    			user: req.user,
		    			noContents: noContents,
		    			current: page,    
		                pages: Math.ceil(count / perPage),
		                url: req.url
		    		});
        		}
        	})
        }
    });

	// Content.find({_id: {$in: ids}}, function(err, likedContents){
 //        if(err){
 //            console.log(err);
 //        } else {
 //        	if (likedContents < 1) {
 //        		noContents = "Haven't liked any content";
 //        	}
 //        	res.render('profile', 
 //    			{request: request,
 //    			 contents: likedContents,
 //    			 user: req.user,
 //    			 noContents: noContents
 //    			}
 //    		)
 //        }
 //    })  
});

router.get("/contents", function(req, res) {

 	var request = "contentsCreated"; 
	var noContents = null;

	User.findById(req.user._id, function(err, userFound){
		if(err){
			console.log(err);
		} else{
	        Content.find({'author.id': userFound._id}, function(err, myContents){
	        	if(err){
	        		console.log(err);
	        	} else{
	        		if(myContents < 1) {
	        			noContents = "Haven't shared anything yet"
	        		}
	        		res.render('profile', 
	        			{
	        			 request: request,
	        			 user: userFound,
	        			 myContents: myContents,
	        			 noContents: noContents
	        			}
	        		);
	        	}
	        })
		}
	}) 
})

router.get("/:id", middleware.authCheck, function(req, res) {
	var likeList = []
	var noContents = null;

	User.findById(req.params.id, function(err, userFound){
		if (err) {
			console.log(err);
		} else {
			var ids = userFound.contentLiked;
			Content.find({_id: {$in: ids}}, function(err, foundContent){
		        if(err){
		            console.log(err);
		        } else{
		        	likeList = foundContent;    
        		}
        	})

        	Content.find({'author.id': userFound._id}, function(err, myContents){
	        	if(err){
	        		console.log(err);
	        	} else{
	        		if(myContents < 1) {
	        			noContents = "Haven't shared anything yet"
	        		}
	        		res.render('wall', 
	        			{contents: likeList,
	        			 olouser: userFound,
	        			 myContents: myContents,
	        			 noContents: noContents
	        			}
	        		);
	        	}
	        })
    	}
	})
});

//======== FOLLOW and UNFOLLOW ========
router.post("/:id", function (req, res) {
    User.findById(req.user._id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else { 
            
            User.findById(req.params.id, function(err, foundOlouser) {
                if (err) {
                    console.log(err);
                } else {
                    if (foundUser.following.indexOf(foundOlouser._id) != -1) {
                        
                        foundOlouser.follower -= 1;
                        foundOlouser.followed.pull(foundUser._id);
                        foundOlouser.save();

                        foundUser.following.pull(foundOlouser._id);
                        foundUser.save();

                        req.flash("error", "Successully Unfollowed!");
                        res.redirect('back');
                        

                    } else {

                    	foundOlouser.follower += 1;
                        foundOlouser.followed.push(foundUser._id);
                        foundOlouser.save();

                        foundUser.following.push(foundOlouser._id);
                        foundUser.save();

                        req.flash("success", "Successfully Followed!");
                        res.redirect('back');
                        
                    }
                }
            });
        }
    });
});
module.exports = router;
