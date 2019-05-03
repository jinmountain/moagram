// ====== npm =========
const express = require('express');
const router = express.Router();

const querystring = require('querystring');

// ====== Routes ====== 
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
	        		res.render(req.user.lang + '/profile', 
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

router.get('/setting', middleware.authCheck, (req, res) => {
	res.render(req.user.lang + '/setting');
});

router.put('/', middleware.authCheck, (req, res) => {

	var newData = {
        emailPrivacy: req.body.emailSetting,
		lang: req.body.languageSetting,
		status: req.body.status
    };

	User.findByIdAndUpdate(req.user.id, {$set: newData}, function(err, foundUser){
        if(err){
            req.flash("error", err.message);
            res.redirect('/' + foundUser.lang + '/profile');
        } else {
        	if (foundUser.lang == 'en'){
		        req.flash("success", "Updated Your Profile");
		    } else if (foundUser.lang == 'ko'){
		    	req.flash("success", "프로필 업데이트 완료");
		    } else {
		        req.flash("success", "Updated Your Profile");
		    }
        }
    });
    res.redirect('/' + req.body.languageSetting + '/profile');
});


router.get('/likes', middleware.authCheck, (req, res) => {

	var request= "contentsLiked";
	var ids = req.user.contentLiked;
	var noLikes = null;

	//pagination
	var perPage = 16;
    var page = req.query.page || 1;

    if(req.query.search){
    	const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    	Content.find({
    		_id: {$in: ids},
    		name: regex
    	})
		.sort({"createdAt": -1})
	    .skip((perPage * page) - perPage)
	    .limit(perPage)
	    .exec(function(err, likedContents){
	        if(err){
	            console.log(err);
	        } else {
	        	Content.find({
	        		_id: {$in: ids},
	        		name: regex
	        	}).count().exec(function(err, count){
	        		if(err) {
	        			console.log(err);
	        		} else {
	        			if (likedContents < 1) {
			        		noLikes = "Haven't liked any content";
			        	}
			        	res.render(req.user.lang + '/profile', {
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
    } else {
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
			        	res.render(req.user.lang + '/profile', {
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
    }
});

router.get("/contents", middleware.authCheck, function(req, res) {

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
			if(req.query.search){
				const regex = new RegExp(escapeRegex(req.query.search), 'gi');
				Content.find({
					'author.id': userFound._id,
					name: regex
				})
	        	.sort({"createdAt": -1})
			    .skip((perPage * page) - perPage)
			    .limit(perPage)
		        .exec(function(err, myContents){
		        	if(err){
		        		console.log(err);
		        	} else { 
		        		Content.find({
		        			'author.id': userFound._id,
		        			name: regex
		        		}).count().exec(function(err, count){
		        			if(err) {
		        				console.log(err);
		        			} else {
				        		if(myContents < 1) {
				        			noContents = "Haven't shared anything yet"
				        		}
				        		res.render(req.user.lang + '/profile', 
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
				        		res.render(req.user.lang + '/profile', 
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
		}
	});
});

router.get("/following", middleware.authCheck, function(req, res){
	var request = "following";
	var noFollowings = null;
	var id = req.user._id;
	//pagination
	var perPage = 16;
    var page = req.query.page || 1; 

    if(req.query.search) {
    	const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    	User.findById(id, function(err, userFound){
			if(err){
				console.log(err);
			} else {
				var ids = userFound.following;

				User.find({
					_id: {$in: ids},
					username: regex
				}).skip((perPage * page) - perPage)
				.limit(perPage)
				.exec(function(err, myFollowings){
					if(err) {
						console.log(err);
					} else {
						User.find({
							_id: {$in: ids},
							username: regex
						}).count().exec(function(err, count){
							if(err) {
								console.log(err);
								console.log(myFollowings);
							} else {
								if(ids < 1) {
									noFollowers = "You are not following anyone :x"
								}
									res.render(req.user.lang + '/profile', {
									request: request,
									user: userFound,

									myFollowings: myFollowings,
									noFollowings: noFollowings,

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
    } else {
    	User.findById(id, function(err, userFound){
			if(err){
				console.log(err);
			} else {
				var ids = userFound.following;

				User.find({_id: {$in: ids}}).skip((perPage * page) - perPage)
				.limit(perPage)
				.exec(function(err, myFollowings){
					if(err) {
						console.log(err);
					} else {
						User.find({_id: {$in: ids}}).count().exec(function(err, count){
							if(err) {
								console.log(err);
								console.log(myFollowings);
							} else {
								if(ids < 1) {
									noFollowings = "You are not following anyone :X"
								}
									res.render(req.user.lang + '/profile', {
									request: request,
									user: userFound,

									myFollowings: myFollowings,
									noFollowings: noFollowings,

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
    }
});

// router.get('/likes/search/:search', middleware.authCheck, (req, res) => {

// 	var request= "contentsLiked";
// 	var ids = req.user.contentLiked;
// 	var noLikes = null;

// 	const regex = new RegExp(escapeRegex(req.params.search), 'gi');

// 	//pagination
// 	var perPage = 16;
//     var page = req.query.page || 1;
//     var count;

// 	Content.find({
// 		_id: {$in: ids},
// 		name: regex
// 	})
// 	.sort({"createdAt": -1})
//     .skip((perPage * page) - perPage)
//     .limit(perPage)
//     .exec(function(err, likedContents){
//         if(err){
//             console.log(err);
//         } else {
//         	Content.find({
// 				_id: {$in: ids},
// 				name: regex
// 			}).exec(function(err, count){
//                 if(err) {
//                     console.log(err);
//                 } else {
//         			if (likedContents < 1) {
// 		        		noLikes = "Haven't liked any content";
// 		        	}
// 		        	res.render(req.user.lang + '/profile', {
// 		        		request: request,
// 					 	contents: likedContents,
// 		    			user: req.user,
// 		    			noLikes: noLikes,

// 		    			current: page,    
// 		                pages: Math.ceil(count / perPage),

// 		                url: req.url
// 		    		});	
// 		        }
// 	        });
//         }
//     }); 
// });

// router.get("/contents/search/:search", middleware.authCheck, function(req, res) {

//  	var request = "contentsCreated";
//  	var ids = req.user._id;  
// 	var noContents = null;

// 	const regex = new RegExp(escapeRegex(req.params.search), 'gi');

// 	//pagination
// 	var perPage = 16;
//     var page = req.query.page || 1;

// 	User.findById(ids, function(err, userFound){
// 		if(err){
// 			console.log(err);
// 		} else {
// 	        Content.find({
// 	        	'author.id': userFound._id,
// 	        	name: regex
// 	        })
//         	.sort({"createdAt": -1})
// 		    .skip((perPage * page) - perPage)
// 		    .limit(perPage)
// 	        .exec(function(err, myContents){
// 	        	if(err){
// 	        		console.log(err);
// 	        	} else { 
// 	        		Content.find({'author.id': userFound._id}).count().exec(function(err, count){
// 	        			if(err) {
// 	        				console.log("gagag");
// 	        			} else {
// 			        		if(myContents < 1) {
// 			        			noContents = "Haven't shared anything yet"
// 			        		}
// 			        		res.render(req.user.lang + '/profile', 
// 			        			{
// 			        			 request: request,
// 			        			 user: userFound,
// 			        			 myContents: myContents,
// 			        			 noContents: noContents,

// 		 		    			current: page,    
// 				                pages: Math.ceil(count / perPage),

// 				                url: req.url
// 			        			}
// 			        		);
// 	        			}
// 	        		});
// 	        	}
// 	        });
// 		}
// 	});
// });

// router.get("/followers/search/:search", middleware.authCheck, function(req, res){
// 	var request = "followers";
// 	var noFollowers = null;
// 	var id = req.user._id;

// 	const regex = new RegExp(escapeRegex(req.params.search), 'gi');

// 	//pagination
// 	var perPage = 16;
//     var page = req.query.page || 1; 

//     User.findById(id, function(err, userFound){
// 		if(err){
// 			console.log(err);
// 		} else {
// 			var ids = userFound.followed;

// 			User.find({
// 				_id: {$in: ids},
// 				username: regex
// 			})
// 			.skip((perPage * page) - perPage)
// 			.limit(perPage)
// 			.exec(function(err, myFollowers){
// 				if(err) {
// 					console.log(err);
// 				} else {
// 					User.find({_id: {$in: ids}}).count().exec(function(err, count){
// 						if(err) {
// 							console.log(err);
// 							console.log(myFollowers);
// 						} else {
// 							if(ids < 1) {
// 								noFollowers = "No one followed you yet :D"
// 							}
// 								res.render(req.user.lang + '/profile', {
// 								request: request,
// 								user: userFound,

// 								myFollowers: myFollowers,
// 								noFollowers: noFollowers,

// 								current: page,    
// 								pages: Math.ceil(count / perPage),

// 				                url: req.url
// 							});	
// 						}
// 					});
// 				}
// 			});
// 		}
// 	});
// });

//==== Wall Page Backend Code Start Here====
//==========================================
router.get("/:id", middleware.authCheck, function(req, res, next) {
	var request = "overview";
	var likeList = []; 
	var noContents = null;
	var noLikes = null;
	var moreContents = null;
	var moreLikes = null;

	User.findById(req.params.id, function(err, userFound){
		if (err) {
			err.httpStatusCode = 500;
            return next(err);
		} else if (userFound == null) {
			req.flash("error", "The user is not found");
            res.redirect("back");
		} else {
			var ids = userFound.contentLiked;
			Content.find({_id: {$in: ids}})
			.limit(8)
			.sort({"createdAt": -1})
			.exec(function(err, likedContents){
				if(err){
		            err.httpStatusCode = 500
            		return next(err);
		        } else{
		        	if(likedContents > 8) {
		        		moreLikes = 1;
		        	}
		        	Content.find({'author.id': userFound._id})
			        	.limit(8)
			        	.sort({"createdAt": -1})
			        	.exec(function(err, myContents){
		        		if(err){
			        		err.httpStatusCode = 500
            				return next(err);
			        	} else{
			        		if(myContents < 1) {
			        			noContents = "Haven't shared anything yet"
			        		}
			        		else if(myContents > 8) {
			        			moreContents = 1;
			        		}
			        		res.render(req.user.lang + '/wall', 
			        			{request: request,

			        			 contents: likedContents,
			        			 olouser: userFound,
			        			 myContents: myContents,

			        			 noContents: noContents,
			        			 noLikes: noLikes,

			        			 moreLikes: moreLikes,
			        			 moreContents: moreContents
			        			}
			        		);
			        	} 	
			        });  
        		}
			});  	
    	}
	})
});

// ===== Wall Page Likes ======

router.get('/:id/likes', middleware.authCheck, (req, res, next) => {

	var request= "contentsLiked";
	var ids = [];
	var likeList = []; 
	var noLikes = null;

	//pagination
	var perPage = 16;
    var page = req.query.page || 1;

    User.findById(req.params.id, function(err, userFound){
    	if(err){
    		err.httpStatusCode = 404;
            return next(err);
    	} else {
    		var ids = userFound.contentLiked;

    		if(req.query.search){
    			const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    			Content.find({
    				_id: {$in: ids},
    				name: regex
    			})
				.sort({"createdAt": -1})
			    .skip((perPage * page) - perPage)
			    .limit(perPage)
			    .exec(function(err, likedContents){
			        if(err){
			            console.log(err);
			        } else {
			        	Content.find({
			        		_id: {$in: ids},
			        		name: regex
			        	}).count().exec(function(err, count){
			        		if(err) {
			        			console.log(err);
			        		} else {
			        			if (likedContents < 1) {
					        		noLikes = "Haven't liked any content";
					        	}
					        	res.render(req.user.lang + '/wall', {
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
    		} else {
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
					        	res.render(req.user.lang + '/wall', {
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
    	}
    }) 
});

router.get("/:id/contents", middleware.authCheck, function(req, res) {

 	var request = "contentsCreated";
 	var ids = req.user._id;  
	var noContents = null;

	//pagination
	var perPage = 16;
    var page = req.query.page || 1;

    

	User.findById(req.params.id, function(err, userFound){
		if(err){
			err.httpStatusCode = 404;
            return next(err);
		} else {
			if(req.query.search){
				const regex = new RegExp(escapeRegex(req.query.search), 'gi');

				Content.find({
		        	'author.id': userFound._id,
		        	name: regex
		        })
	        	.sort({"createdAt": -1})
			    .skip((perPage * page) - perPage)
			    .limit(perPage)
		        .exec(function(err, myContents){
		        	if(err){
		        		console.log(err);
		        	} else { 
		        		Content.find({
		        			'author.id': userFound._id,
		        			name: regex
	        			}).count()
		        		.exec(function(err, count){
		        			if(err) {
		        				console.log(err);
		        			} else {
				        		if(myContents < 1) {
				        			noContents = "Haven't shared anything yet"
				        		}
				        		res.render(req.user.lang + '/wall', {
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
			} else {
				Content.find({
		        	'author.id': userFound._id
		        })
	        	.sort({"createdAt": -1})
			    .skip((perPage * page) - perPage)
			    .limit(perPage)
		        .exec(function(err, myContents){
		        	if(err){
		        		console.log(err);
		        	} else { 
		        		Content.find({
		        			'author.id': userFound._id
	        			}).count()
		        		.exec(function(err, count){
		        			if(err) {
		        				console.log(err);
		        			} else {
				        		if(myContents < 1) {
				        			noContents = "Haven't shared anything yet"
				        		}
				        		res.render(req.user.lang + '/wall', {
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
		}
	});
});

//==== Wall Following Seciton ====
router.get("/:id/following", middleware.authCheck, function(req, res, next){
	var request = "following";
	var noFollowings = null;

	//pagination
	var perPage = 16;
    var page = req.query.page || 1; 
    
    User.findById(req.params.id, function(err, userFound){
		if(err){
			err.httpStatusCode = 404;
            return next(err);
		} else {
			var ids = userFound.following;

			if(req.query.search){
				const regex = new RegExp(escapeRegex(req.query.search), 'gi');
				User.find({
					_id: {$in: ids},
					username: regex
				}).skip((perPage * page) - perPage)
				.limit(perPage)
				.exec(function(err, myFollowings){
					if(err) {
						console.log(err);
					} else {
						User.find({
							_id: {$in: ids},
							username: regex
						}).count().exec(function(err, count){
							if(err) {
								console.log(err);
							} else {
								if(myFollowings < 1){
									noFollowings = userFound.username + " is not following anyone yet :x";
								}
								res.render(req.user.lang + '/wall', {
									request: request,
									olouser: userFound,

									myFollowings: myFollowings,
									noFollowings: noFollowings,

									current: page,    
									pages: Math.ceil(count / perPage),

					                url: req.url
								});
							}
						});
					}
				});
			} else {
				User.find({_id: {$in: ids}}).skip((perPage * page) - perPage)
				.limit(perPage)
				.exec(function(err, myFollowings){
					if(err) {
						console.log(err);
					} else {
						User.find({_id: {$in: ids}}).count().exec(function(err, count){
							if(err) {
								console.log(err);
							} else {
								if(myFollowings < 1){
									noFollowings = userFound.username + " is not following anyone yet :x";
								}
								res.render(req.user.lang + '/wall', {
									request: request,
									olouser: userFound,

									myFollowings: myFollowings,
									noFollowings: noFollowings,

									current: page,    
									pages: Math.ceil(count / perPage),

					                url: req.url
								});
							}
						});
					}
				});
			}
		}
	});
});

// //================= Wall Like Search =========================

// router.get('/:id/likes/search/:search', middleware.authCheck, (req, res) => {

// 	var request= "contentsLiked";
// 	var ids = [];
// 	var likeList = []; 
// 	var noLikes = null;

// 	const regex = new RegExp(escapeRegex(req.params.search), 'gi');

// 	//pagination
// 	var perPage = 16;
//     var page = req.query.page || 1;

//     User.findById(req.params.id, function(err, userFound){
//     	if(err){
//     		err.httpStatusCode = 404;
//             return next(err);
//     	} else {
//     		var ids = userFound.contentLiked;

//     		Content.find({
//     			_id: {$in: ids},
//     			name: regex
//     		})
// 			.sort({"createdAt": -1})
// 		    .skip((perPage * page) - perPage)
// 		    .limit(perPage)
// 		    .exec(function(err, likedContents){
// 		        if(err){
// 		            console.log(err);
// 		        } else {
// 		        	Content.find({_id: {$in: ids}}).count().exec(function(err, count){
// 		        		if(err) {
// 		        			console.log(err);
// 		        		} else {
// 		        			if (likedContents < 1) {
// 				        		noLikes = "Haven't liked any content";
// 				        	}
// 				        	res.render(req.user.lang + '/wall', {
// 				        		request: request,
// 							 	contents: likedContents,
// 							 	olouser: userFound,
				    			
// 				    			noLikes: noLikes,

// 				    			current: page,    
// 				                pages: Math.ceil(count / perPage),

// 				                url: req.url
// 				    		});
// 		        		}
// 		        	})
// 		        }
// 		    });
//     	}
//     }) 
// });

// //========= Wall Content Search =========

// router.get("/:id/contents/search/:search", middleware.authCheck, function(req, res) {

//  	var request = "contentsCreated";
//  	var ids = req.user._id;  
// 	var noContents = null;

// 	const regex = new RegExp(escapeRegex(req.params.search), 'gi');

// 	//pagination
// 	var perPage = 16;
//     var page = req.query.page || 1;

// 	User.findById(req.params.id, function(err, userFound){
// 		if(err){
// 			err.httpStatusCode = 404;
//             return next(err);
// 		} else {
// 	        Content.find({
// 	        	'author.id': userFound._id,
// 	        	name: regex
// 	        })
//         	.sort({"createdAt": -1})
// 		    .skip((perPage * page) - perPage)
// 		    .limit(perPage)
// 	        .exec(function(err, myContents){
// 	        	if(err){
// 	        		console.log(err);
// 	        	} else { 
// 	        		Content.find({'author.id': userFound._id}).count().exec(function(err, count){
// 	        			if(err) {
// 	        				console.log(err);
// 	        			} else {
// 			        		if(myContents < 1) {
// 			        			noContents = "Haven't shared anything yet"
// 			        		}
// 			        		res.render(req.user.lang + '/wall', {
// 								request: request,
// 								olouser: userFound,
// 								myContents: myContents,
// 								noContents: noContents,

// 								current: page,    
// 								pages: Math.ceil(count / perPage),

// 				                url: req.url
// 			        		});
// 	        			}
// 	        		});
// 	        	}
// 	        });
// 		}
// 	});
// });

// //========= Wall Follower Search =======

// router.get("/:id/followers/search/:search", middleware.authCheck, function(req, res){
// 	var request = "followers";
// 	var noFollowers = null;

// 	const regex = new RegExp(escapeRegex(req.params.search), 'gi');

// 	//pagination
// 	var perPage = 16;
//     var page = req.query.page || 1; 
    
//     User.findById(req.params.id, function(err, userFound){
// 		if(err){
// 			err.httpStatusCode = 404;
//             return next(err);
// 		} else {
// 			var ids = userFound.followed;

// 			User.find({
// 				_id: {$in: ids},
// 				name: regex
// 			}).skip((perPage * page) - perPage)
// 			.limit(perPage)
// 			.exec(function(err, myFollowers){
// 				if(err) {
// 					console.log(err);
// 				} else {
// 					User.find({_id: {$in: ids}}).count().exec(function(err, count){
// 						if(err) {
// 							console.log(err);
// 						} else {
// 							if(myFollowers < 1){
// 								noFollowers = "No one followed " + userFound.username + " yet :D";
// 							}
// 							res.render(req.user.lang + '/wall', {
// 								request: request,
// 								olouser: userFound,

// 								myFollowers: myFollowers,
// 								noFollowers: noFollowers,

// 								current: page,    
// 								pages: Math.ceil(count / perPage),

// 				                url: req.url
// 							});
// 						}
// 					});
// 				}
// 			});
// 		}
// 	});
// });

//======== FOLLOW and UNFOLLOW ========
router.post("/:id", function (req, res) {
    User.findById(req.user._id, function (err, foundUser) {
        if (err) {
            err.httpStatusCode = 500;
            return next(err);
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

                        if(req.user.lang == "en"){
                        	req.flash("error", "Successully Unfollowed " + foundOlouser.username);
                        } else if(req.user.lang == "ko"){
                        	req.flash("error", foundOlouser.username + " 를 Unfollow 했습니다");
                        } else {
                        	req.flash("error", "Successully Unfollowed " + foundOlouser.username);
                        }
                        res.redirect('back');
                        

                    } else {

                    	foundOlouser.follower += 1;
                        foundOlouser.followed.push(foundUser._id);
                        foundOlouser.save();

                        foundUser.following.push(foundOlouser._id);
                        foundUser.save();

                        if(req.user.lang == "en"){
                        	req.flash("success", "Successully Followed " + foundOlouser.username);
                        } else if(req.user.lang == "ko"){
                        	req.flash("success", foundOlouser.username + " 를 Follow 했습니다");
                        } else {
                        	req.flash("success", "Successully Followed " + foundOlouser.username);
                        }
                        res.redirect('back');
                        
                    }
                }
            });
        }
    });
});

// router.get("/", function(req, res, next){
// 	if(req.params.params == "contents" || req.params.params == "profile"){
// 		next();
// 	} else {
// 		res.status(404).render('./error', {
// 	        err: "404",
// 	        message: "Oops. Page not found"
// 	    });
// 	}
// });

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
