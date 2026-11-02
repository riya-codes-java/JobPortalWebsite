const User = require('../models/User');
const Job = require('../models/Job');
const jobController = require('./jobController');
const Application = require('../models/Application');

exports.home = async (req, res) => {
  const { jobs, query } = await jobController.searchJobs(req, 12);
  const totalJobs = await Job.countDocuments();
  const companies = (await Job.distinct('company')).length;
  res.render('home', { jobs, query, totalJobs, companies });
};

exports.getSignup = (req, res) => res.render('auth/signup');

exports.postSignup = async (req, res) => {
  try {
    const { name, email, password, role, company } = req.body;
    if (!['student', 'recruiter'].includes(role)) throw new Error('Invalid role');
    if (await User.findOne({ email: email.toLowerCase() })) {
      req.session.flash = 'Email already registered';
      return res.redirect('/signup');
    }
    // password is hashed inside the User model (pre-save hook)
    await User.create({ name, email, password, role, company: role === 'recruiter' ? company : undefined });
    req.session.flash = 'Account created! Please login';
    res.redirect('/login');
  } catch (err) {
    req.session.flash = err.message;
    res.redirect('/signup');
  }
};

exports.getLogin = (req, res) => res.render('auth/login');

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    // same message for both cases so attackers can't guess which emails exist
    if (!user || !(await user.comparePassword(password))) {
      req.session.flash = 'Invalid email or password';
      return res.redirect('/login');
    }
    // regenerate session id after login (prevents session fixation)
    req.session.regenerate((err) => {
      if (err) return res.redirect('/login');
      req.session.user = { id: user._id.toString(), name: user.name, role: user.role, company: user.company };
      req.session.save(() => res.redirect('/dashboard'));
    });
  } catch (err) {
    req.session.flash = 'Something went wrong';
    res.redirect('/login');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};

exports.dashboard = async (req, res) => {
  const { id, role } = req.session.user;
  if (role === 'recruiter') {
    const jobs = await Job.find({ postedBy: id });
    const jobIds = jobs.map(j => j._id);
    const totalApplicants = await Application.countDocuments({ job: { $in: jobIds } });
    return res.render('dashboard/recruiter', { jobCount: jobs.length, totalApplicants });
  }
  const applied = await Application.countDocuments({ applicant: id });
  res.render('dashboard/student', { applied });
};
