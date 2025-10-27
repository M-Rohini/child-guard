const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: String,
  answer: String,
  tags: [String]
});

// Export only the model
module.exports = mongoose.model('FAQ', faqSchema);