const mongoose = require("mongoose");
//const Joi = require('joi');

const commentSchema = new mongoose.Schema({
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String,
      thumbnail: String
   },
   contentId: String,
   comment: 
      {
         type: String,
         required: true
      },
   createdAt: Number,
   date: String,
   likes: Number,
   replies: [
      {  
         commentId: String,
         author: 
         {
            id: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "User"
            },
            username: String,
            thumbnail: String
         },
         reply: 
         {
            type: String,
            required: true
         },
         createdAt: Number,
         date: String,
         likes: Number,
         hotness: Number,
         edited: Boolean
      }
   ],
   hotness: Number,
   edited: Boolean
});

module.exports = mongoose.model('Comment', commentSchema);