var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');


// define the schema for our user model
var userSchema = mongoose.Schema({
    username: String,
	googleId: String,
	lang: String,
	
	email: {
		type: String,
		lowercase: true
		},

	thumbnail: String,

	//contents you created
	contentCreated: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "content"
		}
	],

	//contents you liked
    contentLiked: [
	  	{
	     	type: mongoose.Schema.Types.ObjectId,
	     	ref: "Content"
	  	}
	],

	lastActiveTime: String,

	follower: Number,

	//users you are following
	following: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		}
	],

	//users who are following you
	followed: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		}
	],

	//contents you viewed
	contentViewed: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Content"
		}
	],

	//introduction
	status: String,

	//email privacy setting
	emailPrivacy: String
});

module.exports = mongoose.model('User', userSchema);