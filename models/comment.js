var mongoose = require("mongoose");

var commentSchema = new mongoose.Schema({
  txt: String,
  createdAt: {
      type: Date

  },
  author: {
    id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    username: String
  },
  comments: [
    {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Comment"
    }
  ]
});

module.exports = mongoose.model("Comment", commentSchema);

// function validateComment(comment) {
//  const schema = {
//    txt: Joi.string().min(5).max(255).required()
//  };
//   return Joi.validate(comment, schema);
// }
// exports.Comment = Comment;
// exports.validate = validateComment;