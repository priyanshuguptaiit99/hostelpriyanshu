/**
 * Script to create an admin user
 * Run with: node create-admin.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel_management');
        console.log('✅ MongoDB connected');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'adminpriyanshu@hostel.com' });
        
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log('Email: adminpriyanshu@hostel.com');
            console.log('Updating password...');
            
            // Update password
            existingAdmin.password = 'priyanshu';
            existingAdmin.role = 'admin';
            existingAdmin.approvalStatus = 'approved';
            existingAdmin.isActive = true;
            await existingAdmin.save();
            console.log('✅ Admin password updated to: priyanshu');
        } else {
            // Create new admin user
            const admin = await User.create({
                name: 'System Administrator',
                collegeId: 'ADMIN001',
                email: 'adminpriyanshu@hostel.com',
                password: 'priyanshu',
                role: 'admin',
                approvalStatus: 'approved',
                isActive: true,
                phoneNumber: '9696625055'
            });

            console.log('✅ Admin user created successfully!');
            console.log('\n📧 Login Credentials:');
            console.log('Email: adminpriyanshu@hostel.com');
            console.log('Password: apriyanshu');
            console.log('Role: admin');
        }

        // Check warden (don't update password)
        const existingWarden = await User.findOne({ email: 'wardenpriyanshu@hostel.com' });
        
        if (!existingWarden) {
            await User.create({
                name: 'Hostel Warden',
                collegeId: 'WARDEN001',
                email: 'wardenpriyanshu@hostel.com',
                password: 'priyanshu',
                role: 'warden',
                approvalStatus: 'approved',
                isActive: true,
                phoneNumber: '9696625055'
            });
            console.log('\n✅ Warden user created!');
            console.log('Email: wardenpriyanshu@hostel.com');
            console.log('Password: priyanshu');
        } else {
            console.log('\n✅ Warden already exists (password unchanged)');
        }

        // Check student (don't update password)
        const existingStudent = await User.findOne({ email: 'studentpriyanshu@hostel.com' });
        
        if (!existingStudent) {
            await User.create({
                name: 'Student',
                collegeId: 'CS2024001',
                email: 'studentpriyanshu@hostel.com',
                password: 'priyanshu',
                role: 'student',
                approvalStatus: 'approved',
                roomNumber: '101',
                hostelBlock: 'A',
                department: 'Computer Science',
                year: 2,
                isActive: true,
                phoneNumber: '9696625055'
            });
            console.log('\n✅ Test student created!');
            console.log('Email: studentpriyanshu@hostel.com');
            console.log('Password: priyanshu');
        } else {
            console.log('✅ Student already exists (password unchanged)');
        }

        console.log('\n🎉 Setup complete! You can now login with these credentials.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
};

createAdmin();
