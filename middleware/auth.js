module.exports = {
  ensureAuth: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.redirect('/login');
    }
  },
  ensureSupplier: function(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'supplier') {
        return next();
    } else {
        res.redirect('/dashboard');
    }
  },
  ensureVendor: function(req, res, next) {
    if (req.isAuthenticated() && req.user && req.user.role.toLowerCase() === 'vendor') {
        return next();
    } else {
        req.flash('error_msg', 'You must be a vendor to view this page.');
        res.redirect('/dashboard');
    }
},
   ensureAdmin: function(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    } else {
        req.flash('error_msg', 'You are not authorized to view this page.');
        res.redirect('/dashboard');
    }
  }
};
