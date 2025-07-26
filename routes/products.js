const express = require('express');
const router = express.Router();
const crypto = require('crypto'); // To generate unique codes
const Product = require('../models/Product');
const User = require('../models/User');

// Import our new role-checking middleware
const { ensureAuth, ensureSupplier, ensureVendor } = require('../middleware/auth');

// @desc    Show page to list a new item
// @route   GET /products/new
router.get('/products/new', ensureSupplier, (req, res) => {
  res.render('list_item', { user: req.user });
});

// @desc    Process the form to list a new item
// @route   POST /products
router.post('/products', ensureSupplier, async (req, res) => {
  try {
    const { name, description, price, unit } = req.body;
    
    // Generate a unique code for tracking
    const uniqueCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    await Product.create({
      name,
      description,
      price,
      unit,
      supplier: req.user.id,
      uniqueCode: `${req.user.locality.slice(0,3).toUpperCase()}-${uniqueCode}`
    });

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    // You can render an error page here
    res.send('Error creating product');
  }
});

// @desc    Show marketplace to vendors with local products
// @route   GET /marketplace
router.get('/marketplace', ensureVendor, async (req, res) => {
    try {
        // Find products and populate the supplier's details
        // Then, filter these products to match the vendor's locality
        const products = await Product.find()
            .populate('supplier') // This fetches the full User document for the supplier
            .sort({ createdAt: 'desc' })
            .lean(); // .lean() makes queries faster, returns plain JS objects

        const localProducts = products.filter(p => p.supplier && p.supplier.locality === req.user.locality);

        res.render('marketplace', {
            user: req.user,
            products: localProducts
        });
    } catch (err) {
        console.error(err);
        res.send('Error fetching marketplace');
    }
});

// @desc    Add an item to the vendor's cart
// @route   POST /cart/add/:id
router.post('/cart/add/:id', ensureVendor, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const productId = req.params.id;

        const itemIndex = user.cart.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            // If item exists, increment quantity
            user.cart[itemIndex].quantity += 1;
        } else {
            // If item doesn't exist, add it to cart
            user.cart.push({ product: productId, quantity: 1 });
        }
        await user.save();
        req.flash('success_msg', 'Item added to cart!');
        res.redirect('/marketplace');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error adding item to cart.');
        res.redirect('/marketplace');
    }
});

// @desc    Show the cart page
// @route   GET /cart
router.get('/cart', ensureVendor, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('cart.product').lean();
        
        let totalPrice = 0;
        if (user.cart) {
            user.cart.forEach(item => {
                if (item.product) { 
                    totalPrice += item.quantity * item.product.price;
                }
            });
        }
        res.render('cart', { user, cart: user.cart, totalPrice });
    } catch (err) {
        console.error(err);
        res.send('Error loading cart');
    }
});

// @desc    Remove an item from the cart
// @route   POST /cart/remove/:id
router.post('/cart/remove/:id', ensureVendor, async (req, res) => {
    try {
        await User.updateOne(
            { _id: req.user.id },
            { $pull: { cart: { product: req.params.id } } }
        );
        req.flash('success_msg', 'Item removed from cart.');
        res.redirect('/cart');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error removing item.');
        res.redirect('/cart');
    }
});

// routes/products.js

// @desc    Show edit page for a product
// @route   GET /products/edit/:id
router.get('/edit/:id', ensureSupplier, async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, supplier: req.user.id }).lean();
        if (!product) {
            // If product not found or doesn't belong to the user, redirect.
            return res.redirect('/dashboard');
        }
        res.render('edit_item', { user: req.user, product });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// @desc    Update a product
// @route   POST /products/edit/:id
router.post('/edit/:id', ensureSupplier, async (req, res) => {
    try {
        await Product.findOneAndUpdate(
            { _id: req.params.id, supplier: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// @desc    Delete a product
// @route   POST /products/delete/:id
router.post('/delete/:id', ensureSupplier, async (req, res) => {
    try {
        await Product.deleteOne({ _id: req.params.id, supplier: req.user.id });
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});


module.exports = router;