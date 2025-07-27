const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Grievance = require('../models/Grievance');
const { ensureAuth, ensureVendor, ensureSupplier } = require('../middleware/auth');

// @desc    Show page to file a new grievance
// @route   GET /grievances/file/:orderId
router.get('/file/:orderId', ensureVendor, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).lean();
        if (!order || order.vendor.toString() !== req.user.id) {
            req.flash('error_msg', 'Order not found.');
            return res.redirect('/orders/history');
        }
        res.render('file_grievance', { user: req.user, order });
    } catch (err) {
        console.error(err);
        res.redirect('/orders/history');
    }
});

// @desc    Process the grievance form
// @route   POST /grievances/file/:orderId
router.post('/file/:orderId', ensureVendor, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order || order.vendor.toString() !== req.user.id) {
            req.flash('error_msg', 'Order not found.');
            return res.redirect('/orders/history');
        }

        // For simplicity, we assume one supplier per order.
        // A real app might have multiple suppliers per order.
        const supplierId = order.products[0].supplier;

        await Grievance.create({
            order: req.params.orderId,
            vendor: req.user.id,
            supplier: supplierId,
            reason: req.body.reason
        });

        req.flash('success_msg', 'Your complaint has been filed and is under review.');
        res.redirect('/orders/history');

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to file complaint.');
        res.redirect('/orders/history');
    }
});

// @desc    Show all grievances filed by a vendor
// @route   GET /grievances/my-complaints
router.get('/my-complaints', ensureVendor, async (req, res) => {
    try {
        const complaints = await Grievance.find({ vendor: req.user.id })
            .populate('supplier', 'email')
            .populate('order', '_id')
            .sort({ createdAt: 'desc' })
            .lean();
        res.render('my_complaints', { user: req.user, complaints });
    } catch (err) {
        console.error(err);
        res.send('Error loading complaints page.');
    }
});

// @desc    Show all grievances filed against a supplier
// @route   GET /grievances/view
router.get('/view', ensureSupplier, async (req, res) => {
    try {
        const complaints = await Grievance.find({ supplier: req.user.id })
            .populate('vendor', 'email')
            .populate('order', '_id')
            .sort({ createdAt: 'desc' })
            .lean();
        res.render('view_complaints', { user: req.user, complaints });
    } catch (err) {
        console.error(err);
        res.send('Error loading complaints page.');
    }
});
// @desc    Add a resolution note from a supplier
// @route   POST /grievances/add-note/:id
router.post('/add-note/:id', ensureSupplier, async (req, res) => {
    try {
        const { supplierNote } = req.body;
        const grievance = await Grievance.findOne({
            _id: req.params.id,
            supplier: req.user.id // Ensure the supplier owns this grievance
        });

        if (!grievance) {
            req.flash('error_msg', 'Complaint not found.');
            return res.redirect('/grievances/view');
        }

        grievance.supplierNote = supplierNote;
        await grievance.save();

        req.flash('success_msg', 'Your note has been added.');
        res.redirect('/grievances/view');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to add note.');
        res.redirect('/grievances/view');
    }
});

module.exports = router;