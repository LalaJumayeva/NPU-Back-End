const User = require('../database/user.model');

const getProfile = async(req, res) => {
    const { id } = req.user;
    try {
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Something went wrong. Please try logging out and log in again' });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

const editProfile = async (req, res) => {
    const { username } = req.body;
    const avatar = req.file;
    const { id } = req.user

    try {
        if (!username && !avatar) {
            return res.status(400).json({ error: 'Please provide username or avatar' });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ error: 'Something went wrong. Please try logging out and log in again' });
        }

        if (username) {
            user.username = username;
        }

        if (avatar) {
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `avatar/${id}/${avatar.originalname}`,
                Body: avatar.buffer,
            }

            const { Location } = await req.s3.upload(params).promise();
            user.avatar = Location;
        }

        await user.save();
        return res.status(200).json({ message: 'Profile updated successfully', user});
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

module.exports = {
    getProfile,
    editProfile
}
