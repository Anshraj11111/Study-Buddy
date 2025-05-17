// const User = require('../models/user');
// // Find and render matched users
// exports.findMatch = async (req, res) => {
//   try {
//     const users = await User.find({ 
//       subject: req.session.user.subject, 
//       _id: { $ne: req.session.user._id }  // Exclude the current user
//     });

//     res.render('match', { 
//       user: req.session.user, 
//       matches: users 
//     });
//   } catch (error) {
//     console.error('Error finding matches:', error);
//     res.redirect('/dashboard');
//   }
// };






// controllers/matchcontroller.js

const User = require('../models/user');
const Doubt = require('../models/doubt');
const natural = require('natural'); // For text similarity matching

// Find users with similar subjects
exports.findMatch = async (req, res) => {
  try {
    const users = await User.find({
      subject: req.session.user.subject,
      _id: { $ne: req.session.user._id } // Exclude the current user
    });
    
    res.render('match', {
      user: req.session.user,
      matches: users
    });
  } catch (error) {
    console.error('Error finding matches:', error);
    res.redirect('/dashboard');
  }
};

// Find similar doubts and match users
exports.findDoubtMatch = async (req, res) => {
  try {
    const doubtId = req.params.doubtId;
    const currentDoubt = await Doubt.findById(doubtId).populate('userId');
    
    if (!currentDoubt) {
      return res.status(404).json({ error: 'Doubt not found' });
    }

    // Get all doubts except the current user's doubt
    const allDoubts = await Doubt.find({
      _id: { $ne: doubtId }, 
      subject: currentDoubt.subject
    }).populate('userId');
    
    // Use TF-IDF for text similarity matching
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();
    
    // Add the current doubt to the corpus
    tfidf.addDocument(`${currentDoubt.title} ${currentDoubt.description}`);
    
    // Add all other doubts to the corpus and calculate similarity
    const similarDoubts = [];
    
    allDoubts.forEach((doubt, index) => {
      tfidf.addDocument(`${doubt.title} ${doubt.description}`);
      
      // Calculate similarity score
      let score = 0;
      tfidf.tfidfs(`${currentDoubt.title} ${currentDoubt.description}`, (i, measure) => {
        if (i === index + 1) { // +1 because we added the current doubt first
          score = measure;
        }
      });
      
      similarDoubts.push({
        doubt,
        score
      });
    });
    
    // Sort by similarity score (descending)
    similarDoubts.sort((a, b) => b.score - a.score);
    
    // Get the top match
    const topMatch = similarDoubts.length > 0 ? similarDoubts[0].doubt : null;
    
    if (topMatch && topMatch.userId) {
      // Create a match room ID (combination of both user IDs)
      const userIds = [currentDoubt.userId._id.toString(), topMatch.userId._id.toString()].sort();
      const roomId = `room_${userIds.join('_')}`;
      
      // Return match details
      return res.json({
        match: true,
        matchedDoubt: topMatch,
        matchedUser: topMatch.userId,
        roomId: roomId
      });
    }
    
    return res.json({ match: false });
  } catch (error) {
    console.error('Error finding doubt matches:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
