const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User'); // Make sure this is also included
// This is the line you need to fix/add
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
      const myProducts = await Product.find({ supplier: req.user.id }).sort({ createdAt: 'desc' }).lean();
      res.render('supplier_dashboard', { 
          user: req.user,
          products: myProducts
      });
    } else {
      res.send('Error: User role not recognized.');
    }
  } catch (err) {
      console.error(err);
      res.send('Error loading dashboard');
  }
});

// @desc    Root route
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