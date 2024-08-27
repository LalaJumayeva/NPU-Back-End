const Joi = require('joi');
const uuid = require('uuid');

Joi.objectId = require('joi-objectid')(Joi);
const Post = require('../database/post.model');
const Category = require('../database/category.model');
const User = require('../database/user.model');


const createPost = async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            description: Joi.string().required(),
            keywords: Joi.array().items(Joi.string()).required(),
            category: Joi.objectId().required(),
            images: Joi.array().items(Joi.string()).optional(),
            createdBy: Joi.objectId().required(),
        })

        const { name, description, keywords, category } = req.body
        const { id } = req.user
        const files = req.files;

        const reqBody = {
            name,
            description,
            keywords,
            category,
            createdBy: id
        }

        const { error } = schema.validate(reqBody)

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const validCategories = await Category.findOne({ _id: category });

        if (!validCategories) {
            return res.status(400).json({ message: "Category not found" });
        }

        if (!files || (files.length === 0 && files.length < 1)) {
            return res.status(400).json({ message: "Please upload an image" });
        }

        if (files.length !== 2) {
            return res.status(400).json({ message: "You must upload 2 images for this post" });
        } else if (files.length > 2) {
            return res.status(400).json({ message: "You can only upload a maximum of 2 images" });
        }

        const imageURL = await Promise.all(
            files.map(async (file) => {
                const fileExtension = file.mimetype.split('/')[1];
                const uploadParams = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: `posts/${uuid.v4()}.${fileExtension}`,
                    Body: file.buffer,
                };

                try {
                    const s3Response = await new Promise((resolve, reject) => {
                        req.s3.upload(uploadParams, (err, data) => {
                            if (err) {
                                return reject(new Error('Error uploading avatar. Error: ' + err.message));
                            }
                            resolve(data);
                        });
                    });
                    return s3Response.Location
                } catch (uploadError) {
                    // Return immediately to avoid multiple responses
                    return res.status(400).json({ error: uploadError.message });
                }
            })
        )

        reqBody.images = imageURL;
        const newPost = new Post(reqBody);
        await newPost.save();

        return res.status(201).json({
            message: "Post created successfully",
            data: newPost
        })
    }
    catch (error) {
        return res.status(500).json({ message: error.message })
    }
};

const getPosts = async (req, res) => {
    try {
        const Posts = await Post.find({}).populate('category', 'name').populate('createdBy', ['username', 'avatar']);
        return res.status(200).json(Posts);
    }
    catch (error) {
        return res.status(500).json({ message: error.message })
    }
};

const getPostbyID = async (req, res) => {
    try {
        const { id } = req.params
        const onePost = await Post.findById(id).populate('category', 'name').populate('createdBy', ['username', 'avatar'])
        return res.status(200).json(onePost)
    }
    catch (error) {
        return res.status(500).json({ message: error.message })
    }
};


const updatePost = async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().optional(),
            description: Joi.string().optional(),
            keywords: Joi.array().items(Joi.string()).optional(),
            category: Joi.objectId().optional(),
        })
        const { id } = req.params
        const { id: user_id } = req.user

        const { name, description, keywords, category } = req.body

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const validCategories = await Category.findOne({ _id: category });

        if (!validCategories) {
            return res.status(400).json({ message: "Category not found" });
        }

        const { error } = schema.validate(req.body)

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        if (post.createdBy.toString() !== user_id) {
            return res.status(401).json({ message: "You are not authorized to update this post" });
        }

        await Post.findByIdAndUpdate(id, {
            name,
            description,
            keywords,
            category
        }, { new: true, runValidators: true });

        return res.status(200).json({ message: "Post updated successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: error.message })
    }
};


const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: user_id } = req.user;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.createdBy.toString() !== user_id) {
            return res.status(401).json({ message: "You are not authorized to delete this post" });
        }

        await Post.findByIdAndDelete(id);
        return res.status(200).json({ message: "Post deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const likePost = async(req, res) => {
    try {
        const { id } = req.params;
        const { id: user_id } = req.user;

        const post = await Post.findById(id);
        const user = await User.findById(user_id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.likes.includes(id)) {
            return res.status(400).json({ message: "You have already liked this post" });
        }

        await User.findByIdAndUpdate(user_id, {
            $push: { likes: id }
        }, { new: true, runValidators: true });

        post.likes += 1;
        await post.save();

        return res.status(200).json({ message: "Post liked successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const dislikePost = async(req, res) => {
    try {
        const { id } = req.params;
        const { id: user_id } = req.user;

        const post = await Post.findById(id);
        const user = await User.findById(user_id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.likes.includes(id)) {
            return res.status(400).json({ message: "You have already disLiked this post" });
        }

        await User.findByIdAndUpdate(user_id, {
            $pull: { likes: id }
        }, { new: true, runValidators: true });

        if (post.likes > 0) {
            post.likes -= 1;
            await post.save();
            return res.status(200).json({ message: "Post disliked successfully"})
        }             
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

const getOwnPosts = async (req, res) => {
    try {
        const { id } = req.user;
        const posts = await Post.find({ createdBy: id }).populate('category', 'name');
        return res.status(200).json(posts);
    }
    catch (error) {
        return res.status(500).json({ message: error.message })
    }
}


module.exports = {
    createPost,
    getPosts,
    getPostbyID,
    updatePost,
    deletePost,
    likePost,
    dislikePost,
    getOwnPosts
}
