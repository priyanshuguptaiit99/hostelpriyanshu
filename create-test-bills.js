/**
 * Script to create test mess bills
 * Run with: node create-test-bills.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const MessBill = require('./models/MessBill');
const MessRate = require('./models/MessRate');

dotenv.config();

const createTestBills = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel_management');
        console.log('✅ MongoDB connected');

        // Get or create mess rate
        let messRate = await MessRate.findOne({ month: 2, year: 2026 });
        if (!messRate) {
            // Find warden or admin first
            let admin = await User.findOne({ role: 'admin' });
            if (!admin) {
                admin = await User.findOne({ role: 'warden' });
            }
            
            if (!admin) {
                console.log('❌ No admin or warden found. Please create one first.');
                process.exit(1);
            }

            messRate = await MessRate.create({
                month: 2,
                year: 2026,
                dailyRate: 100,
                effectiveFrom: new Date(2026, 1, 1),
                setBy: admin._id
            });
            console.log('✅ Mess rate created: ₹100/day');
        }

        // Find all students
        const students = await User.find({ role: 'student', isActive: true });
        console.log(`📊 Found ${students.length} students`);

        if (students.length === 0) {
            console.log('⚠️  No students found. Creating a test student...');
            const testStudent = await User.create({
                name: 'Test Student',
                collegeId: 'CS2024TEST',
                email: 'teststudent2@hostel.com',
                password: 'test123',
                role: 'student',
                approvalStatus: 'approved',
                roomNumber: '101',
                hostelBlock: 'A',
                department: 'Computer Science',
                year: 2,
                phoneNumber: '9999999999',
                isActive: true
            });
            students.push(testStudent);
            console.log('✅ Test student created');
        }

        // Find warden to set as generatedBy
        let warden = await User.findOne({ role: 'warden' });
        if (!warden) {
            warden = await User.findOne({ role: 'admin' });
        }

        if (!warden) {
            console.log('❌ No warden or admin found. Please create one first.');
            process.exit(1);
        }

        let created = 0;
        let skipped = 0;

        for (const student of students) {
            // Check if bill already exists
            const existingBill = await MessBill.findOne({
                studentId: student._id,
                month: 2,
                year: 2026
            });

            if (existingBill) {
                skipped++;
                continue;
            }

            // Create bill with random attendance (15-28 days)
            const totalDays = Math.floor(Math.random() * 14) + 15;
            const rate = messRate.dailyRate;
            const totalAmount = totalDays * rate;

            await MessBill.create({
                studentId: student._id,
                month: 2,
                year: 2026,
                totalDays,
                rate,
                totalAmount,
                paymentStatus: Math.random() > 0.5 ? 'paid' : 'pending',
                generatedBy: warden._id
            });

            created++;
        }

        console.log('\n📊 Summary:');
        console.log(`✅ Created: ${created} bills`);
        console.log(`⏭️  Skipped: ${skipped} bills (already exist)`);
        console.log(`📅 Month: February 2026`);
        console.log(`💰 Rate: ₹${messRate.dailyRate}/day`);

        // Show total stats
        const allBills = await MessBill.find({ month: 2, year: 2026 });
        const totalAmount = allBills.reduce((sum, b) => sum + b.totalAmount, 0);
        const paidCount = allBills.filter(b => b.paymentStatus === 'paid').length;
        const pendingCount = allBills.filter(b => b.paymentStatus === 'pending').length;

        console.log('\n💵 Total Stats:');
        console.log(`Total Bills: ${allBills.length}`);
        console.log(`Total Amount: ₹${totalAmount}`);
        console.log(`Paid: ${paidCount}`);
        console.log(`Pending: ${pendingCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createTestBills();
