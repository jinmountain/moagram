var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');


// define the schema for our user model
var userSchema = mongoose.Schema({
    username: String,
	googleId: String,

	email: {
		type: String,
		lowercase: true
		},

	thumbnail: String,

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
	]

});


// methods ======================
// generating a hash 
// userSchema.methods.generateHash = function(password) {
//     return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
// };

// checking if password is valid
// userSchema.methods.validPassword = function(password) {
//     return bcrypt.compareSync(password, this.local.password);
// };

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);