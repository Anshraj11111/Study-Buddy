const bcrypt = require('bcrypt');
const User = require('../models/user');

// Register user
exports.registerUser = async (req, res) => {
  const { name, email, password, subject } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'User already exists');
      return res.redirect('/auth'); // Redirect back to login page if user exists
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({ name, email, password: hashedPassword, subject });
    await newUser.save();

    // Store the new user in the session
    req.session.user = newUser; // Store user in session

    req.flash('success', 'Registration successful');
    res.redirect('/dashboard'); // Redirect to dashboard after registration
  } catch (error) {
    console.error(error);
    req.flash('error', 'Registration failed');
    res.redirect('/auth'); // Redirect back to login page on failure
  }
};

// Login user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/auth'); // Redirect back if email is not found
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/auth'); // Redirect back if password doesn't match
    }

    // Store the user in session if login is successful
    req.session.user = user; // Store user in session
    req.flash('success', 'Login successful');
    res.redirect('/dashboard'); // Redirect to dashboard after successful login
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server error');
    res.redirect('/auth'); // Redirect back to login page on server error
  }
};
