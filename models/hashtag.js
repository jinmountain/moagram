const mongoose = require("mongoose");

const hashtagSchema = new mongoose.Schema({
	name: {
	  type: String, 
	  required: true
	},
	image: String,
	video: {
	  url: String,
	  provider: String,
	  id: String
	},
	category: String,
	description: String,
	createdAt: String,
	author: {
	  id: {
	     type: mongoose.Schema.Types.ObjectId,
	     ref: "User"
	  },
	  username: String
	},
	likes: Number,
	comments: [
	  {
	     type: mongoose.Schema.Types.ObjectId,
	     ref: "Comment"
	  }
	],
	views: Number
});

module.exports = mongoose.model('Hashtag', hashtagSchema);