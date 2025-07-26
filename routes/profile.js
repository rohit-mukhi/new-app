const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/auth');

// @desc    Show user profile page
// @route   GET /profile
router.get('/', ensureAuth, (req, res) => {
    res.render('profile', { user: req.user });
});

// @desc    Handle password change
// @route   POST /profile/change-password
router.post('/change-password', ensureAuth, (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        req.flash('error_msg', 'New passwords do not match.');
        return res.redirect('/profile');
    }

    req.user.changePassword(oldPassword, newPassword, (err) => {
        if (err) {
            req.flash('error_msg', 'Incorrect original password.');
            return res.redirect('/profile');
        }
        req.flash('success_msg', 'Password changed successfully.');
        res.redirect('/profile');
    });
});

module.exports = router;