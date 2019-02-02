const mongoose = require('mongoose');
const User = mongoose.model('User');

exports.validateSignup = (req, res, next) => {
    req.sanitizeBody('name');
    req.sanitizeBody('email');
    req.sanitizeBody('password');

    req.checkBody('name', 'Enter a name').notEmpty();
    req.checkBody('name', 'Name must be between 4 and 10 chars').isLength({ min: 4, max: 10 });
    req.checkBody('email', 'Enter a valid email').isEmail().normalizeEmail();
    req.checkBody('password', 'Enter a password').notEmpty();
    req.checkBody('password', 'Password must be between 4 and 10 chars').isLength({ min: 4, max: 10 });
    const errors = req.validationErrors();
    if (errors) {
        return res.status(400).send(errors.map(e => e.msg));
    }
    next();
};

exports.signup = async (req, res) => {
    const { name, email, password } = req.body;
    const user = await new User({ name, email, password });
    await User.register(user, password, (err, user) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.json(user);
    });
};

exports.signin = () => {};

exports.signout = () => {};

exports.checkAuth = () => {};
