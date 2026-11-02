const mongoose = require('mongoose');
const Job = require('../models/Job');
const Application = require('../models/Application');

// helper: find a job only if it belongs to the logged-in recruiter
const findOwnJob = (jobId, userId) => Job.findOne({ _id: jobId, postedBy: userId });

// ----- Public (guests + logged in) -----
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// shared by home page and /jobs
exports.searchJobs = async (req, limit = 0) => {
  const { q, location, jobType } = req.query;
  const filter = {};
  if (q) filter.title = { $regex: esc(q), $options: 'i' };
  if (location) filter.location = { $regex: esc(location), $options: 'i' };
  if (jobType) filter.jobType = jobType;
  let cursor = Job.find(filter).sort({ createdAt: -1 });
  if (limit) cursor = cursor.limit(limit);
  return { jobs: await cursor, query: { q, location, jobType } };
};

exports.listJobs = async (req, res) => {
  const { jobs, query } = await exports.searchJobs(req);
  res.render('jobs/list', { jobs, query });
};

exports.showJob = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).render('error', { message: 'Job not found' });
  }
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).render('error', { message: 'Job not found' });
  let hasApplied = false;
  if (req.session.user && req.session.user.role === 'student') {
    hasApplied = !!(await Application.findOne({ job: job._id, applicant: req.session.user.id }));
  }
  res.render('jobs/show', { job, hasApplied });
};

// ----- Recruiter only -----
exports.newForm = (req, res) => res.render('jobs/new');

exports.createJob = async (req, res) => {
  try {
    const { title, company, location, salary, jobType, description } = req.body;
    await Job.create({ title, company, location, salary, jobType, description, postedBy: req.session.user.id });
    req.session.flash = 'Job posted successfully';
    res.redirect('/jobs/mine');
  } catch (err) {
    req.session.flash = err.message;
    res.redirect('/jobs/new');
  }
};

exports.myJobs = async (req, res) => {
  const jobs = await Job.find({ postedBy: req.session.user.id }).sort({ createdAt: -1 });
  res.render('jobs/mine', { jobs });
};

exports.editForm = async (req, res) => {
  const job = await findOwnJob(req.params.id, req.session.user.id);
  if (!job) return res.status(403).render('error', { message: 'You can only edit your own jobs' });
  res.render('jobs/edit', { job });
};

exports.updateJob = async (req, res) => {
  const { title, company, location, salary, jobType, description } = req.body;
  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, postedBy: req.session.user.id },
    { title, company, location, salary, jobType, description },
    { runValidators: true }
  );
  if (!job) return res.status(403).render('error', { message: 'You can only edit your own jobs' });
  req.session.flash = 'Job updated';
  res.redirect('/jobs/mine');
};

exports.deleteJob = async (req, res) => {
  const job = await findOwnJob(req.params.id, req.session.user.id);
  if (!job) return res.status(403).render('error', { message: 'You can only delete your own jobs' });
  await Application.deleteMany({ job: job._id });
  await job.deleteOne();
  req.session.flash = 'Job deleted';
  res.redirect('/jobs/mine');
};
