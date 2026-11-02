// Authentication: is someone logged in?
exports.isLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    req.session.flash = 'Please login first';
    return res.redirect('/login');
  }
  next();
};

// Authorization: is the logged-in user allowed (by role)?
exports.allowRoles = (...roles) => (req, res, next) => {
  if (!req.session.user || !roles.includes(req.session.user.role)) {
    return res.status(403).render('error', { message: 'Access denied: you are not allowed to view this page' });
  }
  next();
};

// Keep logged-in users away from login/signup pages
exports.guestOnly = (req, res, next) => {
  if (req.session.user) return res.redirect('/dashboard');
  next();
};
