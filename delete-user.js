/**
 * Delete User Script
 * Usage: node delete-user.js your-email@nitj.ac.in
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const deleteUser = async (email) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find and delete user
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            console.log('❌ User not found with email:', email);
            process.exit(1);
        }

        console.log('\n📋 User Details:');
        console.log('Name:', user.name);
        console.log('Email:', user.email);
        console.log('College ID:', user.collegeId);
        console.log('Role:', user.role);
        console.log('Email Verified:', user.emailVerified);
        console.log('Google ID:', user.googleId || 'N/A');

        // Delete user
        await User.deleteOne({ _id: user._id });
        console.log('\n✅ User deleted successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('❌ Please provide an email address');
    console.log('Usage: node delete-user.js your-email@nitj.ac.in');
    process.exit(1);
}

deleteUser(email);
