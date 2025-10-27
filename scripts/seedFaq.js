const mongoose = require('mongoose');
const fs = require('fs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/childguard')
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.log('MongoDB connection error:', err));

// FAQ Schema
const faqSchema = new mongoose.Schema({
  question: String,
  answer: String,
  tags: [String]
});
const FAQ = mongoose.model("FAQ", faqSchema);

// Insert Q&A from JSON file
async function seedData() {
  const data = JSON.parse(fs.readFileSync('./childguard_dataset.json', 'utf8'));
  
  await FAQ.deleteMany(); // clear old data
  await FAQ.insertMany(data);
  console.log("✅ FAQs inserted from file!");
  mongoose.connection.close(); // close connection gracefully

}

seedData();