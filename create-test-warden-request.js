/**
 * Script to create a test warden request
 * Run with: node create-test-warden-request.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const WardenRequest = require('./models/WardenRequest');

dotenv.config();

const createTestWardenRequest = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel_management');
        console.log('✅ MongoDB connected');

        // Find or create a test student who will request warden access
        let testStudent = await User.findOne({ email: 'teststudent@hostel.com' });
        
        if (!testStudent) {
            testStudent = await User.create({
                name: 'Test Student Requesting Warden',
                collegeId: 'CS2024999',
                email: 'teststudent@hostel.com',
                password: 'test123',
                role: 'student',
                approvalStatus: 'approved',
                roomNumber: '999',
                hostelBlock: 'Z',
                department: 'Computer Science',
                year: 3,
                phoneNumber: '9999999999',
                isActive: true
            });
            console.log('✅ Test student created');
        } else {
            console.log('✅ Test student already exists');
        }

        // Check if this student already has a pending request
        const existingRequest = await WardenRequest.findOne({
            userId: testStudent._id,
            status: 'pending'
        });

        if (existingRequest) {
            console.log('⚠️  This student already has a pending warden request');
            console.log('Request ID:', existingRequest._id);
            console.log('Status:', existingRequest.status);
        } else {
            // Create a new warden request
            const wardenRequest = await WardenRequest.create({
                userId: testStudent._id,
                name: testStudent.name,
                email: testStudent.email,
                collegeId: testStudent.collegeId,
                department: testStudent.department,
                phoneNumber: testStudent.phoneNumber,
                status: 'pending'
            });

            console.log('\n✅ Test warden request created successfully!');
            console.log('Request ID:', wardenRequest._id);
            console.log('Student:', wardenRequest.name);
            console.log('Email:', wardenRequest.email);
            console.log('Status:', wardenRequest.status);
            console.log('\n📝 You can now login as admin and approve/reject this request');
        }

        // Show summary
        const totalRequests = await WardenRequest.countDocuments();
        const pendingRequests = await WardenRequest.countDocuments({ status: 'pending' });
        
        console.log('\n📊 Summary:');
        console.log(`Total warden requests: ${totalRequests}`);
        console.log(`Pending requests: ${pendingRequests}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createTestWardenRequest();
