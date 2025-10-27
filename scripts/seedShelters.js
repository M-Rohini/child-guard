// scripts/seedShelters.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seedShelters() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/childguard', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Shelter Schema
        const shelterSchema = new mongoose.Schema({
            name: { type: String, required: true },
            type: { type: String, enum: ['emergency', 'long_term', 'family'], required: true },
            location: { type: String, required: true },
            address: { type: String, required: true },
            contact: { type: String, required: true },
            capacity: { type: Number, required: true },
            currentOccupancy: { type: Number, required: true },
            description: String,
            services: [String],
            verified: { type: Boolean, default: false },
            available: { type: Boolean, default: true },
            createdAt: { type: Date, default: Date.now }
        });

        const Shelter = mongoose.model('Shelter', shelterSchema);

        // Read JSON data
        const dataPath = path.join(__dirname, '../data/shelters.json');
        const rawData = fs.readFileSync(dataPath);
        const jsonData = JSON.parse(rawData);
        const sheltersData = jsonData.shelters;

        console.log(`📁 Loaded ${sheltersData.length} shelters from JSON`);

        // Clear existing data
        const deletedCount = await Shelter.deleteMany({});
        console.log(`🧹 Cleared ${deletedCount.deletedCount} existing shelters`);

        // Insert new data
        const result = await Shelter.insertMany(sheltersData);
        console.log(`✅ ${result.length} shelters seeded successfully`);

        // Show summary
        const summary = await Shelter.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    available: { 
                        $sum: { 
                            $cond: [{ $eq: ['$available', true] }, 1, 0] 
                        } 
                    },
                    totalCapacity: { $sum: '$capacity' },
                    currentOccupancy: { $sum: '$currentOccupancy' }
                }
            }
        ]);

        console.log('\n📊 Shelters Summary:');
        summary.forEach(item => {
            const availability = Math.round((item.currentOccupancy / item.totalCapacity) * 100);
            console.log(`   ${item._id}: ${item.count} shelters, ${availability}% occupied`);
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
    seedShelters();
}

module.exports = seedShelters;