require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }), // sessions survive restarts
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// available in every EJS file: user + one-time flash message
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use('/', require('./routes/authRoutes'));
app.use('/jobs', require('./routes/jobRoutes'));
app.use('/applications', require('./routes/applicationRoutes'));

app.use((req, res) => res.status(404).render('error', { message: 'Page not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { message: 'Server error' });
});

const PORT = process.env.PORT || 3001;
connectDB().then(() => app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`)))
  .catch(err => { console.error('DB connection failed', err); process.exit(1); });
