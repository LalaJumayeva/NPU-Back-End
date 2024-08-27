const uuid = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../database/user.model');

// email, password, avatar, username
const register = async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.ref('password'),
    avatar: Joi.string().optional(), 
    username: Joi.string().required(),
  })

  try {
    const { email, password, confirmPassword, avatar, username } = req.body;

    const { error } = schema.validate({
      email, password, confirmPassword, avatar, username
    });

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let avatarUrl = avatar; // Default to whatever is provided in the body

    if (req.file) {
      const fileExtension = req.file.mimetype.split('/')[1];
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `avatars/${uuid.v4()}.${fileExtension}`,
        Body: req.file.buffer,
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

        avatarUrl = s3Response.Location;

      } catch (uploadError) {
        // Return immediately to avoid multiple responses
        return res.status(400).json({ error: uploadError.message });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      avatar: avatarUrl,
      username,
    });

    if (!newUser) {
      return res.status(400).json({ error: 'Error creating user' });
    }

    return res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

const login = async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  try {
    const { email, password } = req.body;
    const { error } = schema.validate({ email, password });

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Hashing and encryption

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const jwtPayload = {
      id: user._id,
    }

    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET)

    return res.status(200).json({
      message: 'User logged in successfully',
      token
    })

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  register,
  login
}
