# Hostel Management System

A complete web-based hostel management application built with Node.js, Express, MongoDB, and vanilla JavaScript. **Now with a completely redesigned modern UI!**

## 👨‍💻 Created By

**Priyanshu**

A professional-grade hostel management system featuring:
- Modern UI/UX with 50+ animations
- Google OAuth integration
- Role-based access control
- Real-time notifications
- Dark mode support
- Fully responsive design

---

## ✨ What's New in v2.2

🎨 **Complete UI Overhaul** - Modern, beautiful, and intuitive interface
🌙 **Dark Mode** - Toggle between light and dark themes
📊 **Enhanced Dashboards** - Visual statistics and progress tracking
🔍 **Search & Filter** - Find information quickly
📥 **Export to CSV** - Download reports and data
🔔 **Notifications** - Real-time feedback for all actions
📱 **Fully Responsive** - Perfect on mobile, tablet, and desktop
⚡ **Performance Optimized** - Faster loading and smoother animations

[See full changelog](CHANGELOG.md) | [Features guide](FEATURES_GUIDE.md) | [Quick reference](QUICK_REFERENCE.md)

## Features

### 1. Authentication System
- Secure email-based login
- Email verification
- Password reset functionality
- Role-based access control (Student, Warden, Mess Staff, Maintenance Staff)

### 2. Student Features
- View attendance records
- Check and download mess bills
- Submit daily food ratings
- File and track maintenance complaints
- View hostel announcements

### 3. Warden/Admin Features
- Mark daily attendance
- Manage room allocations
- Generate monthly bills
- View and assign complaints
- Post announcements
- Access comprehensive reports

### 4. Mess Staff Features
- View daily meal counts
- Monitor food ratings and feedback
- Access billing summaries

### 5. Maintenance Staff Features
- View assigned complaints
- Update complaint status
- Track work history

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd hostel-management-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hostel_management
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRE=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

4. **Install and start MongoDB**
Make sure MongoDB is installed and running on your system.

For macOS:
```bash
brew install mongodb-community
brew services start mongodb-community
```

For Ubuntu:
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

5. **Start the application**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

6. **Access the application**
Open your browser and navigate to:
```
http://localhost:5000
```

## Project Structure

```
hostel-management-system/
├── models/              # Database models
│   ├── User.js
│   ├── Attendance.js
│   ├── Billing.js
│   ├── Complaint.js
│   ├── Feedback.js
│   ├── Announcement.js
│   └── Room.js
├── routes/              # API routes
│   ├── auth.js
│   ├── attendance.js
│   ├── billing.js
│   ├── complaints.js
│   ├── feedback.js
│   ├── announcements.js
│   ├── rooms.js
│   └── dashboard.js
├── middleware/          # Custom middleware
│   └── auth.js
├── utils/              # Utility functions
│   ├── email.js
│   └── generateToken.js
├── public/             # Frontend files
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js
│   │   ├── auth.js
│   │   └── dashboard.js
│   └── index.html
├── server.js           # Main server file
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify/:token` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/me` - Get current user

### Attendance
- `POST /api/attendance` - Mark attendance (Warden only)
- `GET /api/attendance/student/:studentId` - Get student attendance
- `GET /api/attendance/report/:studentId/:month/:year` - Monthly report
- `GET /api/attendance/alerts` - Get attendance alerts (Warden only)

### Billing
- `POST /api/billing/generate` - Generate monthly bill (Warden/Mess Staff)
- `GET /api/billing/student/:studentId` - Get student bills
- `GET /api/billing/:id` - Get specific bill
- `PUT /api/billing/:id/payment` - Update payment status
- `GET /api/billing/summary/:month/:year` - Financial summary (Warden)

### Feedback
- `POST /api/feedback` - Submit food rating
- `GET /api/feedback` - Get feedback (Warden/Mess Staff)
- `GET /api/feedback/analytics` - Rating analytics
- `GET /api/feedback/alerts` - Low rating alerts

### Complaints
- `POST /api/complaints` - Submit complaint
- `GET /api/complaints/my-complaints` - Get student's complaints
- `GET /api/complaints` - Get all complaints (Warden/Maintenance)
- `GET /api/complaints/assigned` - Get assigned complaints (Maintenance)
- `PUT /api/complaints/:id` - Update complaint status
- `PUT /api/complaints/:id/feedback` - Submit feedback on completed complaint
- `GET /api/complaints/analytics/summary` - Complaint analytics (Warden)

### Announcements
- `POST /api/announcements` - Create announcement (Warden)
- `GET /api/announcements` - Get announcements
- `GET /api/announcements/:id` - Get single announcement
- `PUT /api/announcements/:id/read` - Mark as read
- `PUT /api/announcements/:id` - Update announcement (Warden)
- `DELETE /api/announcements/:id` - Delete announcement (Warden)

### Rooms
- `POST /api/rooms` - Create room (Warden)
- `GET /api/rooms` - Get all rooms (Warden)
- `GET /api/rooms/:id` - Get single room
- `PUT /api/rooms/:id/allocate` - Allocate student to room (Warden)
- `PUT /api/rooms/:id/deallocate` - Remove student from room (Warden)
- `PUT /api/rooms/:id/status` - Update room status (Warden)
- `GET /api/rooms/stats/occupancy` - Occupancy statistics (Warden)

### Dashboard
- `GET /api/dashboard/student` - Student dashboard data
- `GET /api/dashboard/warden` - Warden dashboard data
- `GET /api/dashboard/mess` - Mess staff dashboard data
- `GET /api/dashboard/maintenance` - Maintenance staff dashboard data

## Default User Roles

When registering, select one of these roles:
- **student** - Access to personal records, complaints, and ratings
- **warden** - Full administrative access
- **mess_staff** - Access to food ratings and billing
- **maintenance_staff** - Access to assigned complaints

## Email Configuration

For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in the `.env` file

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Email verification
- Role-based access control
- Protected API routes

## Future Enhancements

- Push notifications
- Mobile app
- Payment gateway integration
- Advanced analytics and reporting
- File upload for complaints
- Real-time chat support
- Visitor management
- Leave management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email support@hostelmanagement.com or create an issue in the repository.


---

## 📜 License & Copyright

**© 2026 Priyanshu. All Rights Reserved.**

This Hostel Management System is created and maintained by **Priyanshu**.

### Terms of Use

- ✅ Free to use for educational purposes
- ✅ Can be modified for personal projects
- ✅ Attribution required when sharing
- ❌ Commercial use requires permission
- ❌ Cannot claim as your own work

### Attribution

When using or sharing this project, please include:

```
Hostel Management System
Created by Priyanshu
https://github.com/[your-username]/hostel-management-system
```

### Credits

**Developer**: Priyanshu  
**Version**: 2.2  
**Year**: 2024  
**Technologies**: Node.js, Express, MongoDB, JavaScript, CSS3, HTML5  
**Features**: 50+ Animations, Google OAuth, Dark Mode, Responsive Design  

---

## 🙏 Acknowledgments

Special thanks to:
- The open-source community
- MongoDB for database solutions
- Google for OAuth services
- All contributors and testers

---

## 📞 Contact

**Created by Priyanshu**

For questions, suggestions, or collaboration:
- 📧 Email: [your-email@example.com]
- 💼 LinkedIn: [Your LinkedIn Profile]
- 🐙 GitHub: [Your GitHub Profile]

---

## ⭐ Show Your Support

If you found this project helpful, please consider:
- ⭐ Starring the repository
- 🍴 Forking for your own use
- 📢 Sharing with others
- 💬 Providing feedback

---

## 🎉 Final Note

This project represents hundreds of hours of development, featuring:
- 🎨 Professional UI/UX design
- 🔐 Enterprise-grade security
- ⚡ Optimized performance
- 📱 Mobile-first approach
- 🌙 Dark mode support
- ✨ 50+ smooth animations

**Built with ❤️ by Priyanshu**

---

*Hostel Management System v2.2 - Making hostel management easier, one feature at a time.*

**© 2026 Priyanshu. All Rights Reserved.**
