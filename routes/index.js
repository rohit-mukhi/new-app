const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const { ensureAuth, ensureVendor } = require('../middleware/auth');

// @desc    Dashboard router
// @route   GET /dashboard
router.get('/dashboard', ensureAuth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      res.redirect('/admin/dashboard');

    } else if (req.user.role === 'vendor') {
      res.redirect('/marketplace');

    } else if (req.user.role === 'supplier') {
        const supplierId = req.user._id;

        // 1. Get all products for this supplier
        const myProducts = await Product.find({ supplier: supplierId }).sort({ createdAt: 'desc' }).lean();

        // 2. Calculate analytics using aggregation
        const analytics = await Order.aggregate([
            { $match: { status: 'Delivered' } },
            { $unwind: '$products' },
            { $match: { 'products.supplier': supplierId } },
            { 
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $multiply: ['$products.product.price', '$products.quantity'] } },
                    completedOrders: { $addToSet: '$_id' }
                }
            }
        ]);

        // 3. Find the top-selling item
        const topSellingItem = await Product.findOne({ supplier: supplierId })
            .sort({ unitsSold: -1 })
            .lean();

        // 4. Format the stats for the view
        const stats = {
            totalRevenue: analytics.length > 0 ? analytics[0].totalRevenue : 0,
            completedOrders: analytics.length > 0 ? analytics[0].completedOrders.length : 0,
            topSellingItem: topSellingItem ? topSellingItem.name : 'N/A'
        };
        
        res.render('supplier_dashboard', { 
            user: req.user,
            products: myProducts,
            totalRevenue: stats.totalRevenue.toFixed(2),
            completedOrders: stats.completedOrders,
            topSellingItem: stats.topSellingItem
        });
    } else {
      res.send('Error: User role not recognized.');
    }
  } catch (err) {
      console.error(err);
      res.send('Error loading dashboard');
  }
});

// @desc    Root route (redirects user)
// @route   GET /
router.get('/', (req, res) => {
    if(req.isAuthenticated()) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// @desc    Display community page for a vendor
// @route   GET /community
router.get('/community', ensureVendor, async (req, res) => {
    try {
        const communityMembers = await User.find({ 
            locality: req.user.locality, 
            _id: { $ne: req.user.id }
        }).lean();

        const vendors = communityMembers.filter(member => member.role === 'vendor');
        const suppliers = communityMembers.filter(member => member.role === 'supplier');

        res.render('community', { user: req.user, vendors, suppliers });
    } catch (err) {
        console.error(err);
        res.send('Error loading community page');
    }
});

module.exports = router;