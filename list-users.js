/**
 * List All Users Script
 * Usage: node list-users.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const listUsers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all users
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });

        if (users.length === 0) {
            console.log('📭 No users found in database');
            process.exit(0);
        }

        console.log(`📋 Total Users: ${users.length}\n`);
        console.log('='.repeat(80));

        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name}`);
            console.log('   Email:', user.email);
            console.log('   College ID:', user.collegeId);
            console.log('   Role:', user.role);
            console.log('   Email Verified:', user.emailVerified ? '✅' : '❌');
            console.log('   Google Login:', user.googleId ? '✅' : '❌');
            console.log('   Approval Status:', user.approvalStatus);
            console.log('   Active:', user.isActive ? '✅' : '❌');
            console.log('   Created:', user.createdAt.toLocaleString());
        });

        console.log('\n' + '='.repeat(80));
        console.log(`\nTo delete a user, run: node delete-user.js <email>`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

listUsers();
