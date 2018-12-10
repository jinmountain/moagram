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
      username: String
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

// function validateContent(content) {
//    const schema = {
//       name: Joi.string().min(5).max(50).required(),
//       description: Joi.string().min(5).max(255).required()
//    };
//   return Joi.validate(content, schema);
// }
// exports.Content = Content;
// exports.validate = validateContent;
