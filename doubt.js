// const mongoose = require('mongoose');

// const doubtSchema = new mongoose.Schema({
//     title: { type: String, required: true },
//     subject: { type: String, required: true },
//     description: { type: String, required: true },
//     urgency: { type: String, required: true, default: 'medium' },
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     attachments: [String] // to store file paths for attachments
// });

// const Doubt = mongoose.model('Doubt', doubtSchema);

// module.exports = Doubt;
// models/doubt.js
const mongoose = require('mongoose');

const DoubtSchema = new mongoose.Schema({
  title: String,
  subject: String,
  description: String,
  urgency: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model('Doubt', DoubtSchema);
