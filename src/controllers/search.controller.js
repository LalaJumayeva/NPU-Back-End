const Post = require('../database/post.model');
const Category = require('../database/category.model');

const searchPosts = async (req, res) => {
    try {
        let category = null;
        const {q} = req.query;

        if (!q) {
            return res.status(400).json({ message: 'Please provide a search query' });
        }

        const cat = await Category.findOne({
            name: {
                $regex: q,
                $options: 'i'
            }
        });

        if (cat) {
            console.log("cat: ", cat);
            category = cat._id;
            const posts = await Post.find({ category })
                .populate('category', 'name')
                .populate('createdBy', 'username');
            return res.status(200).json(posts);
        }

        const posts = await Post.find({
            keywords: {
                $regex: q,
                $options: 'i'
            }
        })
            .populate('category', 'name')
            .populate('createdBy', 'username');

        return res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    searchPosts
}
