const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Grievance = require('../models/Grievance');
const { ensureAuth, ensureVendor } = require('../middleware/auth');

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

module.exports = router;