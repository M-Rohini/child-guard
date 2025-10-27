// scripts/seedProfessionals.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seedProfessionals() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/childguard', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Professional Schema
        const professionalSchema = new mongoose.Schema({
            name: { type: String, required: true },
            type: { type: String, enum: ['doctor', 'counselor', 'lawyer', 'social_worker'], required: true },
            specialization: { type: String, required: true },
            location: { type: String, required: true },
            rating: { type: Number, default: 0 },
            experience: { type: String, required: true },
            cost: { type: String, required: true },
            available: { type: Boolean, default: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
            qualifications: [String],
            languages: [String],
            description: String,
            verified: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        });

        const Professional = mongoose.model('Professional', professionalSchema);

        // Read JSON data
        const dataPath = path.join(__dirname, '../data/professionals.json');
        const rawData = fs.readFileSync(dataPath);
        const jsonData = JSON.parse(rawData);
        const professionalsData = jsonData.professionals;

        console.log(`📁 Loaded ${professionalsData.length} professionals from JSON`);

        // Clear existing data
        const deletedCount = await Professional.deleteMany({});
        console.log(`🧹 Cleared ${deletedCount.deletedCount} existing professionals`);

        // Insert new data
        const result = await Professional.insertMany(professionalsData);
        console.log(`✅ ${result.length} professionals seeded successfully`);

        // Show summary
        const summary = await Professional.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    available: { 
                        $sum: { 
                            $cond: [{ $eq: ['$available', true] }, 1, 0] 
                        } 
                    }
                }
            }
        ]);

        console.log('\n📊 Professionals Summary:');
        summary.forEach(item => {
            console.log(`   ${item._id}: ${item.count} total, ${item.available} available`);
        });

        mongoose.connection.close();
        console.log('\n📈 Database connection closed');

    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    seedProfessionals();
}

module.exports = seedProfessionals;