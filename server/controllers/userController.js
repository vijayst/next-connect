const mongoose = require('mongoose');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');

exports.getUsers = async (req, res) => {
    const users = await User.find().select(
        '_id name email createdAt updatedAt'
    );
    res.json(users);
};

exports.getAuthUser = async (req, res) => {
    if (!req.isAuthUser) {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    res.json(req.user);
};

exports.getUserById = async (req, res, next, id) => {
    const user = await User.findOne({ _id: id });
    req.profile = user;
    if (
        user &&
        req.user &&
        mongoose.Types.ObjectId(user._id).equals(req.user._id)
    ) {
        req.isAuthUser = true;
    }
    next();
};

exports.getUserProfile = async (req, res) => {
    if (!req.profile) {
        return res.status(404).json({ message: 'Not found ' });
    }
    res.json(req.profile);
};

exports.getUserFeed = async (req, res) => {
    const { following, id } = req.profile;
    following.push(id);
    const users = await User.find({ _id: { $nin: following } });
    res.json(users);
};

const multerConfig = {
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
};

exports.uploadAvatar = multer(multerConfig).single('avatar');

exports.resizeAvatar = async (req, res, next) => {
    if (!req.file) {
        next();
    }
    const extn = req.file.mimetype.split('/')[1];
    req.body.avatar = `/static/uploads/avatar/${req.user.name}.${extn}`;
    const image = await jimp.read(req.file.buffer);
    image.resize(250, jimp.AUTO);
    image.write('.' + req.body.avatar);
    next();
};

exports.updateUser = async (req, res, next) => {
    req.body.updatedAt = new Date().toISOString();
    const user = await User.findOneAndUpdate(
        { _id: req.user.id },
        { $set: req.body },
        {
            new: true,
            runValidators: true
        }
    );
    res.json(user);
};

exports.deleteUser = async (req, res) => {
    if (!req.isAuthUser) {
        return res.status(400).json({ message: 'You are not authorized' });
    }
    const user = await User.findOneAndDelete({ _id: req.params.userId });
    res.json(user);
};

exports.addFollowing = async (req, res, next) => {
    await User.findOneAndUpdate(
        { _id: req.user._id },
        { $push: { following: req.body.followId } }
    );
    next();
};

exports.addFollower = async (req, res) => {
    const user = await User.findOneAndUpdate(
        { _id: req.body.followId },
        { $push: { followers: req.user._id } },
        { new: true }
    );
    res.json(user);
};

exports.deleteFollowing = async (req, res, next) => {
    await User.findOneAndUpdate(
        { _id: req.user._id },
        { $pull: { following: req.body.followId } }
    );
    next();
};

exports.deleteFollower = async (req, res) => {
    const user = await User.findOneAndUpdate(
        { _id: req.body.followId },
        { $pull: { followers: req.user._id } },
        { new: true }
    );
    res.json(user);
};
