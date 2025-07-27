const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { ensureAuth, ensureVendor, ensureSupplier } = require('../middleware/auth');



// @desc    Process checkout and create order
// @route   POST /orders/checkout
router.post('/checkout', ensureVendor, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'cart.product',
            // This is the key: we must populate the supplier's details from the Product model
            populate: { path: 'supplier' }
        });

        if (!user.cart || user.cart.length === 0) {
            req.flash('error_msg', 'Your cart is empty.');
            return res.redirect('/cart');
        }

        let totalPrice = 0;
        const productsForOrder = user.cart.map(item => {
            // Check if the product and its supplier exist before processing
            if (!item.product || !item.product.supplier) {
                return null;
            }
            totalPrice += item.quantity * item.product.price;
            return {
                product: item.product.toObject(), // Save a snapshot of the product details
                quantity: item.quantity,
                supplier: item.product.supplier._id // This now correctly gets the supplier's ID
            };
        }).filter(item => item !== null); // Remove any items that couldn't be processed

        if (productsForOrder.length === 0) {
            req.flash('error_msg', 'Could not process order. Product data might be missing.');
            return res.redirect('/cart');
        }

        await Order.create({
            vendor: req.user.id,
            products: productsForOrder,
            totalPrice
        });

         for (const item of user.cart) {
        if (item.product) {
            await Product.updateOne(
                { _id: item.product._id },
                { 
                    $inc: { 
                        stock: -item.quantity, // Decrease stock
                        unitsSold: +item.quantity // Increase units sold
                    } 
                }
            );
        }
    }

        // Clear the user's cart after a successful order
        user.cart = [];
        await user.save();

        req.flash('success_msg', 'Your order has been placed!');
        res.redirect('/orders/history');

    } catch (err) {
        console.error('Checkout Error:', err);
        req.flash('error_msg', 'Something went wrong during checkout.');
        res.redirect('/cart');
    }
});

// @desc    Display order history for the vendor
// @route   GET /orders/history
router.get('/history', ensureVendor, async (req, res) => {
    try {
        const orders = await Order.find({ vendor: req.user.id })
            .sort({ orderDate: -1 })
            .lean();
        res.render('order_history', { user: req.user, orders });
    } catch (err) {
        console.error(err);
        res.send('Error fetching order history');
    }
});


// @desc    Display orders for a supplier to manage
// @route   GET /orders/manage
// The route path MUST be "/manage"
// The method MUST be router.get
router.get('/manage', ensureSupplier, async (req, res) => {
    try {
        const orders = await Order.find({ 'products.supplier': req.user.id })
            .populate('vendor', 'email locality')
            .sort({ orderDate: -1 })
            .lean();

        res.render('supplier_orders', { user: req.user, orders });
    } catch (err) {
        console.error(err);
        res.send('Error fetching orders to manage');
    }
});

// @desc    Update the status of an order
// @route   POST /orders/update-status/:id
router.post('/update-status/:id', ensureSupplier, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        
        // Security check: ensure at least one product in the order belongs to this supplier
        const isAuthorized = order.products.some(p => p.supplier.toString() === req.user.id);
        if (!isAuthorized) {
            req.flash('error_msg', 'You are not authorized to update this order.');
            return res.redirect('/orders/manage');
        }

        order.status = status;
        await order.save();
        
        req.flash('success_msg', 'Order status has been updated.');
        res.redirect('/orders/manage');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to update order status.');
        res.redirect('/orders/manage');
    }
});

// routes/orders.js

// @desc    Submit a rating for a supplier on a completed order
// @route   POST /orders/rate/:orderId
router.post('/rate/:orderId', ensureVendor, async (req, res) => {
    try {
        const { rating, supplierId } = req.body;
        const orderId = req.params.orderId;

        // Mark the order as rated to prevent multiple ratings
        await Order.findByIdAndUpdate(orderId, { ratingGiven: true });

        // Update the supplier's rating
        const supplier = await User.findById(supplierId);
        const newTotalRatings = supplier.totalRatings + 1;
        const newAverageRating = ((supplier.averageRating * supplier.totalRatings) + parseInt(rating)) / newTotalRatings;

        supplier.totalRatings = newTotalRatings;
        supplier.averageRating = newAverageRating;
        await supplier.save();

        req.flash('success_msg', 'Thank you for your rating!');
        res.redirect('/orders/history');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Failed to submit rating.');
        res.redirect('/orders/history');
    }
});




module.exports = router;