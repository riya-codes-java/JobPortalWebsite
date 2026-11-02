const Job = require('../models/Job');
const Application = require('../models/Application');

// ----- Student -----
exports.apply = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).render('error', { message: 'Job not found' });
    await Application.create({
      job: job._id,
      applicant: req.session.user.id,
      coverLetter: req.body.coverLetter
    });
    req.session.flash = 'Applied successfully';
  } catch (err) {
    // 11000 = duplicate key (already applied)
    req.session.flash = err.code === 11000 ? 'You already applied to this job' : err.message;
  }
  res.redirect('/applications/mine');
};

exports.myApplications = async (req, res) => {
  const applications = await Application.find({ applicant: req.session.user.id })
    .populate('job').sort({ createdAt: -1 });
  res.render('applications/mine', { applications });
};

// ----- Recruiter -----
exports.applicantsForJob = async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, postedBy: req.session.user.id });
  if (!job) return res.status(403).render('error', { message: 'You can only view applicants of your own jobs' });
  const applications = await Application.find({ job: job._id })
    .populate('applicant', 'name email').sort({ createdAt: -1 });
  res.render('applications/applicants', { job, applications });
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).render('error', { message: 'Invalid status' });
  }
  const application = await Application.findById(req.params.id).populate('job');
  // authorization: the job must belong to this recruiter
  if (!application || application.job.postedBy.toString() !== req.session.user.id) {
    return res.status(403).render('error', { message: 'Not allowed' });
  }
  application.status = status;
  await application.save();
  res.redirect(`/applications/job/${application.job._id}`);
};
