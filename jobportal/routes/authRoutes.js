const router = require('express').Router();
const auth = require('../controllers/authController');
const { isLoggedIn, guestOnly } = require('../middleware/auth');

router.get('/', auth.home);
router.get('/signup', guestOnly, auth.getSignup);
router.post('/signup', guestOnly, auth.postSignup);
router.get('/login', guestOnly, auth.getLogin);
router.post('/login', guestOnly, auth.postLogin);
router.post('/logout', isLoggedIn, auth.logout);
router.get('/dashboard', isLoggedIn, auth.dashboard);

module.exports = router;
