const mongoose = require('mongoose');
const Post = mongoose.model('Post');
const multer = require('multer');
const jimp = require('jimp');

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

exports.uploadImage = multer(multerConfig).single('image');

exports.resizeImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }
    const extn = req.file.mimetype.split('/')[1];
    req.body.image = `/static/uploads/posts/${Date.now()}.${extn}`;
    const image = await jimp.read(req.file.buffer);
    await image.resize(750, jimp.AUTO);
    await image.write('.' + req.body.image);
    next();
};

exports.addPost = async (req, res) => {
    req.body.postedBy = req.user._id;
    const post = await new Post(req.body).save();
    await Post.populate(post, {
        path: 'postedBy',
        select: '_id name avatar'
    });
    res.json(post);
};

exports.deletePost = () => {};

exports.getPostById = () => {};

exports.getPostsByUser = async (req, res) => {
    const posts = await Post.find({ postedBy: req.profile._id })
    .sort({ createdAt: 'desc' });
    res.json(posts);
};

exports.getPostFeed = async (req, res) => {
    const { following, _id } = req.profile;
    following.push(_id);
    const posts = await Post.find({ postedBy: { $in: following }}).sort({ createdAt: 'desc' });
    res.json(posts);
};

exports.toggleLike = () => {};

exports.toggleComment = () => {};
