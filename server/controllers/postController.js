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
    const posts = await Post.find({ postedBy: req.profile._id }).sort({
        createdAt: 'desc'
    });
    res.json(posts);
};

exports.getPostFeed = async (req, res) => {
    const { following, _id } = req.profile;
    following.push(_id);
    const posts = await Post.find({ postedBy: { $in: following } }).sort({
        createdAt: 'desc'
    });
    res.json(posts);
};

exports.toggleLike = async (req, res) => {
    const post = await Post.findOne({ _id: req.body.postId });
    const likes = post.likes.map(l => l.toString());
    if (likes.includes(req.user._id.toString())) {
        post.likes.pull(req.user._id);
    } else {
        post.likes.push(req.user._id);
    }
    await post.save();
    res.json(post);
};

exports.comment = async (req, res) => {
    const { postId, comment } = req.body;
    const post = await Post.findOneAndUpdate(
        { _id: postId },
        { $push: { comments: { text: comment.text, postedBy: req.user._id } } },
        { new: true }
    )
        .populate('postedBy', '_id name avatar')
        .populate('comments.postedBy', '_id name avatar');
    res.json(post);
};

exports.uncomment = async (req, res) => {
    const {
        postId,
        comment: { _id: commentId }
    } = req.body;
    const post = await Post.findOneAndUpdate(
        { _id: postId },
        { $pull: { comments: { _id: commentId } } },
        { new: true }
    )
        .populate('postedBy', '_id name avatar')
        .populate('comments.postedBy', '_id name avatar');
    res.json(post);
};
