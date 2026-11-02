const router = require('express').Router();
const jobs = require('../controllers/jobController');
const { isLoggedIn, allowRoles } = require('../middleware/auth');

// public: anyone can browse and view jobs
router.get('/', jobs.listJobs);

// recruiter-only (keep these BEFORE '/:id')
router.get('/new', isLoggedIn, allowRoles('recruiter'), jobs.newForm);
router.post('/', isLoggedIn, allowRoles('recruiter'), jobs.createJob);
router.get('/mine', isLoggedIn, allowRoles('recruiter'), jobs.myJobs);
router.get('/:id/edit', isLoggedIn, allowRoles('recruiter'), jobs.editForm);
router.put('/:id', isLoggedIn, allowRoles('recruiter'), jobs.updateJob);
router.delete('/:id', isLoggedIn, allowRoles('recruiter'), jobs.deleteJob);

router.get('/:id', jobs.showJob);

module.exports = router;
