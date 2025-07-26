const express = require('express');
const router = express.Router();
const Grievance = require('../models/Grievance');
const { ensureAdmin } = require('../middleware/auth');

// @desc    Show admin dashboard with grievances
// @route   GET /admin/dashboard
router.get('/dashboard', ensureAdmin, async (req, res) => {
    try {
        const grievances = await Grievance.find()
            .populate('vendor', 'email')
            .populate('supplier', 'email')
            .populate('order', '_id')
            .sort({ createdAt: 'desc' })
            .lean();
        res.render('admin_dashboard', { user: req.user, grievances });
    } catch (err) {
        console.error(err);
        res.send('Error loading admin dashboard');
    }
});

// @desc    Update a grievance status
// @route   POST /admin/grievances/update/:id
router.post('/grievances/update/:id', ensureAdmin, async (req, res) => {
    try {
        await Grievance.findByIdAndUpdate(req.params.id, { status: req.body.status });
        req.flash('success_msg', 'Grievance status updated.');
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to update grievance.');
        res.redirect('/admin/dashboard');
    }
});

module.exports = router;