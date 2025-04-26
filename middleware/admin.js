// middleware/admin.js
module.exports = {
    ensureAdmin: function(req, res, next) {
      // First check if user is authenticated
      if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Please log in to access this resource');
        return res.redirect('/auth/login');
      }
      
      // Then check if user is an admin
      if (req.user.isAdmin) {
        return next();
      }
      
      req.flash('error_msg', 'Access denied. Admin privileges required.');
      res.redirect('/');
    }
  };