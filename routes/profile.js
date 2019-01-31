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
	var noLikes = null;
	var moreContents = null;
	var moreLikes = null;

	Content.find({_id: {$in: ids}})
	.limit(8)
	.sort({"createdAt": -1})
	.exec(function(err, likedContents){
        if(err){
            console.log(err);
        } else {
        	if(likedContents < 1) {
        		noLikes = "Haven't Liked anything yet"
        	} else {
        		if(likedContents > 8){
        			moreLikes = 1;
        		}
        		likeList = likedContents;
        	}	
        }
    })

	User.findById(req.user._id, function(err, userFound){
		if(err){
			console.log(err);
		} else{
	        Content
	        .find({'author.id': userFound._id})
	        .limit(8)
	        .sort({"createdAt": -1})
	        .exec(function(err, myContents){
	        	if(err){
	        		console.log(err);
	        	} else{
	        		if(myContents < 1) {
	        			noContents = "Haven't shared anything yet";
	        		}
	        		else if(myContents > 8) {
	        			moreContents = 1;
	        		}
	        		res.render('profile', 
	        			{request: request,
	        			 contents: likeList,
	        			 user: userFound,
	        			 myContents: myContents,

	        			 noContents: noContents,
	        			 noLikes: noLikes,

	        			 moreLikes: moreLikes,
	        			 moreContents: moreContents
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
	var noLikes = null;

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
		        		noLikes = "Haven't liked any content";
		        	}
		        	res.render('profile', {
		        		request: request,
					 	contents: likedContents,
		    			user: req.user,
		    			noLikes: noLikes,

		    			current: page,    
		                pages: Math.ceil(count / perPage),

		                url: req.url
		    		});
        		}
        	})
        }
    }); 
});

router.get("/contents", function(req, res) {

 	var request = "contentsCreated";
 	var ids = req.user._id;  
	var noContents = null;

	//pagination
	var perPage = 16;
    var page = req.query.page || 1;

	User.findById(ids, function(err, userFound){
		if(err){
			console.log(err);
		} else {
	        Content.find({'author.id': userFound._id})
        	.sort({"createdAt": -1})
		    .skip((perPage * page) - perPage)
		    .limit(perPage)
	        .exec(function(err, myContents){
	        	if(err){
	        		console.log(err);
	        	} else { 
	        		Content.find({'author.id': userFound._id}).count().exec(function(err, count){
	        			if(err) {
	        				console.log(err);
	        			} else {
			        		if(myContents < 1) {
			        			noContents = "Haven't shared anything yet"
			        		}
			        		res.render('profile', 
			        			{
			        			 request: request,
			        			 user: userFound,
			        			 myContents: myContents,
			        			 noContents: noContents,

		 		    			current: page,    
				                pages: Math.ceil(count / perPage),

				                url: req.url
			        			}
			        		);
	        			}
	        		});
	        	}
	        });
		}
	});
});

//==== Wall Page Backend Code ====
//================================
router.get("/:id", middleware.authCheck, function(req, res) {
	var request = "overview";
	var likeList = []; 
	var noContents = null;
	var noLikes = null;
	var moreContents = null;
	var moreLikes = null;

	User.findById(req.params.id, function(err, userFound){
		if (err) {
			console.log(err);
		} else {
			var ids = userFound.contentLiked;
			Content.find({_id: {$in: ids}})
			.limit(8)
			.sort({"createdAt": -1})
			.exec(function(err, likedContents){
				if(err){
		            console.log(err);
		        } else{
		        	if(likedContents > 8) {
		        		moreLikes = 1;
		        	}
		        	likeList = likedContents;    
        		}
			})

        	Content.find({'author.id': userFound._id})
        	.limit(8)
        	.sort({"createdAt": -1})
        	.exec(function(err, myContents){
        		if(err){
	        		console.log(err);
	        	} else{
	        		if(myContents < 1) {
	        			noContents = "Haven't shared anything yet"
	        		}
	        		else if(myContents > 8) {
	        			moreContents = 1;
	        		}
	        		res.render('wall', 
	        			{request: request,
	        			 contents: likeList,
	        			 olouser: userFound,
	        			 myContents: myContents,

	        			 noContents: noContents,
	        			 noLikes: noLikes,

	        			 moreLikes: moreLikes,
	        			 moreContents: moreContents
	        			}
	        		);
	        	} 	
	        })
    	}
	})
});

// ===== Wall Page Likes ======

router.get('/:id/likes', middleware.authCheck, (req, res) => {

	var request= "contentsLiked";
	var ids = req.user.contentLiked;
	var likeList = []; 
	var noLikes = null;

	//pagination
	var perPage = 16;
    var page = req.query.page || 1;

    User.findById(req.params.id, function(err, userFound){
    	if(err){
    		console.log(err);
    	} else {
    		var ids = userFound.contentLiked;

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
				        		noLikes = "Haven't liked any content";
				        	}
				        	res.render('wall', {
				        		request: request,
							 	contents: likedContents,
							 	olouser: userFound,
				    			
				    			noLikes: noLikes,

				    			current: page,    
				                pages: Math.ceil(count / perPage),

				                url: req.url
				    		});
		        		}
		        	})
		        }
		    });
    	}
    }) 
});

router.get("/:id/contents", function(req, res) {

 	var request = "contentsCreated";
 	var ids = req.user._id;  
	var noContents = null;

	//pagination
	var perPage = 16;
    var page = req.query.page || 1;

	User.findById(req.params.id, function(err, userFound){
		if(err){
			console.log(err);
		} else {
	        Content.find({'author.id': userFound._id})
        	.sort({"createdAt": -1})
		    .skip((perPage * page) - perPage)
		    .limit(perPage)
	        .exec(function(err, myContents){
	        	if(err){
	        		console.log(err);
	        	} else { 
	        		Content.find({'author.id': userFound._id}).count().exec(function(err, count){
	        			if(err) {
	        				console.log(err);
	        			} else {
			        		if(myContents < 1) {
			        			noContents = "Haven't shared anything yet"
			        		}
			        		res.render('wall', {
								request: request,
								olouser: userFound,
								myContents: myContents,
								noContents: noContents,

								current: page,    
								pages: Math.ceil(count / perPage),

				                url: req.url
			        		});
	        			}
	        		});
	        	}
	        });
		}
	});
});

router.get("/:id/followers", function(req, res){
	var request = "followers";
	var noFollowers = null;

	//pagination
	var perPage = 16;
    var page = req.query.page || 1; 

    User.findById(req.params.id, function(err, userFound){
		if(err){
			console.log(err);
		} else {
			var ids = userFound.followed;

			User.find({_id: {$in: ids}}).skip((perPage * page) - perPage)
			.limit(perPage)
			.exec(function(err, myFollowers){
				if(err) {
					console.log(err);
				} else {
					User.find({_id: {$in: ids}}).count().exec(function(err, count){
						if(err) {
							console.log(err);
						} else {
							if(myFollowers < 1){
								noFollowers = "No followers yet";
							}
							res.render('wall', {
								request: request,
								olouser: userFound,

								myFollowers: myFollowers,
								noFollowers: noFollowers,

								current: page,    
								pages: Math.ceil(count / perPage),

				                url: req.url
							});
						}
					});
				}
			});
		}
	});
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
