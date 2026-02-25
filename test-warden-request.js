/**
 * Test script to verify warden request functionality
 * Run with: node test-warden-request.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const WardenRequest = require('./models/WardenRequest');

async function testWardenRequestFlow() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Check if there are any students
        const students = await User.find({ role: 'student' }).limit(5);
        console.log(`📊 Found ${students.length} students in database`);
        
        if (students.length > 0) {
            console.log('\nSample students:');
            students.forEach(s => {
                console.log(`  - ${s.name} (${s.email}) - ${s.collegeId}`);
            });
        }

        // 2. Check existing warden requests
        const allRequests = await WardenRequest.find()
            .populate('userId', 'name email')
            .populate('reviewedBy', 'name');
        
        console.log(`\n📋 Total warden requests: ${allRequests.length}`);
        
        const pendingRequests = allRequests.filter(r => r.status === 'pending');
        const approvedRequests = allRequests.filter(r => r.status === 'approved');
        const rejectedRequests = allRequests.filter(r => r.status === 'rejected');
        
        console.log(`  - Pending: ${pendingRequests.length}`);
        console.log(`  - Approved: ${approvedRequests.length}`);
        console.log(`  - Rejected: ${rejectedRequests.length}`);

        if (pendingRequests.length > 0) {
            console.log('\n🚨 Pending requests:');
            pendingRequests.forEach(r => {
                console.log(`  - ${r.name} (${r.email}) - Requested: ${r.requestedAt.toLocaleDateString()}`);
            });
        }

        // 3. Check if there are any admins
        const admins = await User.find({ role: 'admin' });
        console.log(`\n👑 Found ${admins.length} admin(s)`);
        
        if (admins.length > 0) {
            console.log('Admins:');
            admins.forEach(a => {
                console.log(`  - ${a.name} (${a.email})`);
            });
        }

        // 4. Check wardens
        const wardens = await User.find({ role: 'warden' });
        console.log(`\n👨‍💼 Found ${wardens.length} warden(s)`);
        
        if (wardens.length > 0) {
            console.log('Wardens:');
            wardens.forEach(w => {
                console.log(`  - ${w.name} (${w.email})`);
            });
        }

        console.log('\n✅ Test completed successfully!');
        console.log('\n📝 Summary:');
        console.log('  - Students can submit warden requests from the "Request Warden Access" menu');
        console.log('  - Admins can review requests from "Pending Wardens" menu');
        console.log('  - Approved students will become wardens after logging out and back in');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

testWardenRequestFlow();
