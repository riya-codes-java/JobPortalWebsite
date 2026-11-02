const router = require('express').Router();
const apps = require('../controllers/applicationController');
const { isLoggedIn, allowRoles } = require('../middleware/auth');

router.use(isLoggedIn);

// student
router.post('/apply/:jobId', allowRoles('student'), apps.apply);
router.get('/mine', allowRoles('student'), apps.myApplications);

// recruiter
router.get('/job/:jobId', allowRoles('recruiter'), apps.applicantsForJob);
router.put('/:id/status', allowRoles('recruiter'), apps.updateStatus);

module.exports = router;
