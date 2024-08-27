const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    name: {
      type:String,
      required: true
    },
    description: {
      type: String,
      required: [true, "Please enter description"]
    },
    keywords: {
      type: [String],
      required: true
    },
    category: {
      type: mongoose.ObjectId,
      required: true,
      ref: 'category'
    },
    images: {
      type: [String],
      required: false
    },
    likes: {
      type: Number,
      required: true,
      default: 0
    },
    createdBy: {
      type: mongoose.ObjectId,
      required: true,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
