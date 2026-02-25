/**
 * Debug script to check warden requests in database
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function checkWardenRequests() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');

        // Define schema inline
        const wardenRequestSchema = new mongoose.Schema({
            userId: mongoose.Schema.Types.ObjectId,
            name: String,
            email: String,
            collegeId: String,
            department: String,
            phoneNumber: String,
            status: String,
            requestedAt: Date,
            reviewedBy: mongoose.Schema.Types.ObjectId,
            reviewedAt: Date,
            reviewNotes: String
        });

        const WardenRequest = mongoose.models.WardenRequest || mongoose.model('WardenRequest', wardenRequestSchema);

        const requests = await WardenRequest.find({});
        
        console.log(`Total warden requests in database: ${requests.length}\n`);
        
        if (requests.length > 0) {
            console.log('All requests:');
            requests.forEach((r, i) => {
                console.log(`${i + 1}. ${r.name} (${r.email})`);
                console.log(`   Status: ${r.status}`);
                console.log(`   Requested: ${r.requestedAt}`);
                console.log(`   College ID: ${r.collegeId}\n`);
            });
        } else {
            console.log('❌ No warden requests found in database!');
            console.log('This means students have not submitted any requests yet.\n');
        }

        // Check users
        const userSchema = new mongoose.Schema({
            name: String,
            email: String,
            role: String,
            collegeId: String
        });
        
        const User = mongoose.models.User || mongoose.model('User', userSchema);
        
        const admins = await User.find({ role: 'admin' });
        const students = await User.find({ role: 'student' });
        const wardens = await User.find({ role: 'warden' });
        
        console.log(`\nUsers in database:`);
        console.log(`  Admins: ${admins.length}`);
        console.log(`  Students: ${students.length}`);
        console.log(`  Wardens: ${wardens.length}`);

        if (admins.length > 0) {
            console.log('\nAdmin accounts:');
            admins.forEach(a => console.log(`  - ${a.name} (${a.email})`));
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\nDisconnected');
    }
}

checkWardenRequests();
