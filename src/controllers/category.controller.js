const Category = require('../database/category.model');

const getCategory = async (req, res) => {
    try {
        const categories = await Category.find({})
        return res.status(200).json({ categories });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

module.exports = {
    getCategory,
}
