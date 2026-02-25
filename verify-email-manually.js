/**
 * Manually Verify Email Script
 * Usage: node verify-email-manually.js <email>
 * 
 * This script manually sets emailVerified=true for a user
 * Use this when email service is not working
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const verifyEmail = async () => {
    try {
        const email = process.argv[2];

        if (!email) {
            console.log('❌ Usage: node verify-email-manually.js <email>');
            console.log('   Example: node verify-email-manually.js priyanshug.cs.25@nitj.ac.in');
            process.exit(1);
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log(`❌ User not found with email: ${email}`);
            console.log('\nRun "node list-users.js" to see all users');
            process.exit(1);
        }

        // Check if already verified
        if (user.emailVerified) {
            console.log(`✅ Email is already verified for: ${user.name}`);
            console.log('   You can login now!');
            process.exit(0);
        }

        // Verify email
        user.emailVerified = true;
        user.emailVerificationOTP = undefined;
        user.emailVerificationOTPExpires = undefined;
        await user.save();

        console.log('✅ Email verified successfully!\n');
        console.log('User Details:');
        console.log('   Name:', user.name);
        console.log('   Email:', user.email);
        console.log('   College ID:', user.collegeId);
        console.log('   Role:', user.role);
        console.log('   Email Verified:', user.emailVerified ? '✅' : '❌');
        console.log('   Google Login:', user.googleId ? '✅' : '❌');
        console.log('\n🎉 You can now login with this account!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

verifyEmail();
