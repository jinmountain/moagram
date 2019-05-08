const mongoose = require("mongoose");
//const Joi = require('joi');

const contentSchema = new mongoose.Schema({
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
   createdAt: Number,
   date: String,
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String,
      thumbnail: String
   },
   likes: Number,
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ],
   views: Number,
   hotness: Number
});

module.exports = mongoose.model('Content', contentSchema);
