/**
 * Script to create test complaints
 * Run with: node create-test-complaints.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Complaint = require('./models/Complaint');

dotenv.config();

const categories = ['electrical', 'plumbing', 'wifi', 'cleanliness', 'hostel', 'mess', 'security', 'other'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const statuses = ['pending', 'in_progress', 'resolved'];

const sampleComplaints = [
    { category: 'electrical', description: 'Light not working in room 101', priority: 'high' },
    { category: 'plumbing', description: 'Water leakage in bathroom', priority: 'urgent' },
    { category: 'wifi', description: 'WiFi connection is very slow', priority: 'medium' },
    { category: 'cleanliness', description: 'Corridor needs cleaning', priority: 'low' },
    { category: 'mess', description: 'Food quality is poor', priority: 'medium' },
    { category: 'security', description: 'Main gate lock is broken', priority: 'high' },
    { category: 'hostel', description: 'AC not working properly', priority: 'high' },
    { category: 'other', description: 'Need extra mattress', priority: 'low' },
];

const createTestComplaints = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel_management');
        console.log('✅ MongoDB connected');

        // Find all students
        const students = await User.find({ role: 'student', isActive: true });
        console.log(`📊 Found ${students.length} students`);

        if (students.length === 0) {
            console.log('❌ No students found. Please create students first.');
            process.exit(1);
        }

        let created = 0;

        for (let i = 0; i < Math.min(sampleComplaints.length, students.length * 2); i++) {
            const student = students[i % students.length];
            const complaint = sampleComplaints[i % sampleComplaints.length];
            
            // Generate ticket ID
            const ticketId = `TKT${Date.now()}${Math.floor(Math.random() * 1000)}`;
            
            // Random status
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            await Complaint.create({
                studentId: student._id,
                ticketId,
                category: complaint.category,
                description: complaint.description,
                priority: complaint.priority,
                status,
                statusHistory: [{
                    status: 'pending',
                    changedBy: student._id,
                    changedAt: new Date(),
                    remarks: 'Complaint submitted'
                }]
            });

            created++;
        }

        console.log(`\n✅ Created ${created} test complaints`);

        // Show stats
        const allComplaints = await Complaint.find();
        const stats = {
            total: allComplaints.length,
            pending: allComplaints.filter(c => c.status === 'pending').length,
            inProgress: allComplaints.filter(c => c.status === 'in_progress').length,
            resolved: allComplaints.filter(c => c.status === 'resolved').length,
        };

        console.log('\n📊 Total Stats:');
        console.log(`Total: ${stats.total}`);
        console.log(`Pending: ${stats.pending}`);
        console.log(`In Progress: ${stats.inProgress}`);
        console.log(`Resolved: ${stats.resolved}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
};

createTestComplaints();
