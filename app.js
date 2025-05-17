

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const flash = require('connect-flash');
const passport = require('passport');
require('dotenv').config();
require('./config/passport');

const http = require('http');
const socketio = require('socket.io');


// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketio(server);


// Connect to MongoDB
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB Connected');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'studybuddysecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 14 * 24 * 60 * 60, // 14 days
  }),
  cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 },
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash Messages
app.use(flash());

// Body Parser & Static Files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Make flash messages available in views
app.use((req, res, next) => {
  res.locals.messages = {
    error: req.flash('error'),
    success: req.flash('success'),
  };
  next();
});

// Make Socket.io instance available in routes
app.set('io', io);

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const doubtRoutes = require('./routes/doubt');
const libraryRoutes = require('./routes/library');
const gyaanbotRoutes = require('./routes/bot');
const quizRoutes = require('./routes/quiz');

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/doubt', doubtRoutes);
app.use('/', libraryRoutes);
app.use('/bot', gyaanbotRoutes);
app.use('/quiz', quizRoutes);

// Root Route
app.get('/', (req, res) => {
  res.render('login');
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});


// -----------------------------
// 🔌 Socket.io Configuration
// -----------------------------
io.on('connection', (socket) => {
  console.log('🔗 New client connected:', socket.id);

  // Personal user notification room
  socket.on('join-user-room', (userId) => {
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`👤 User ${userId} joined their personal room`);
    }
  });

  // Room for video call
  socket.on('join-room', (roomId, userId, userName) => {
    if (roomId) {
      socket.join(roomId);
      console.log(`🎥 ${userName} (${userId}) joined room ${roomId}`);
      socket.to(roomId).emit('user-joined', userId, userName);
    }
  });

  // Leaving a video call room
  socket.on('leave-room', (roomId, userId, userName) => {
    if (roomId) {
      socket.leave(roomId);
      console.log(`👋 ${userName} (${userId}) left room ${roomId}`);
      socket.to(roomId).emit('user-disconnected', userId, userName);
    }
  });

  // WebRTC signaling
  socket.on('offer', (offer, roomId, userId, userName) => {
    console.log(`📨 Offer from ${userName} in room ${roomId}`);
    socket.to(roomId).emit('offer', offer, userName, userId);
  });

  socket.on('answer', (answer, roomId, userId, userName) => {
    console.log(`📨 Answer from ${userName} in room ${roomId}`);
    socket.to(roomId).emit('answer', answer, userName);
  });

  // socket.on('ice-candidate', (candidate, roomId) => {
  //   console.log(`📨 ICE candidate in room ${roomId}`);
  //   socket.to(roomId).emit('ice-candidate', candidate);
  // });
  socket.on('ice-candidate', (candidate, roomId, userId) => {
  console.log(`📨 ICE candidate from ${userId} in room ${roomId}`);
  socket.to(roomId).emit('ice-candidate', candidate, userId);
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
