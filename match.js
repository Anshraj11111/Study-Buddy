const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  users: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  doubts: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doubt' 
  }],
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;