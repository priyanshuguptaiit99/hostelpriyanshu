// Make functions globally accessible
window.loadDashboard = loadDashboard;
window.loadView = loadView;
window.submitMyAttendance = submitMyAttendance;
window.viewBillDetails = viewBillDetails;
window.closeModal = closeModal;
window.showNewComplaintForm = showNewComplaintForm;
window.submitComplaint = submitComplaint;
window.viewComplaintDetails = viewComplaintDetails;
window.renderMyComplaints = renderMyComplaints;
window.renderMyAttendance = renderMyAttendance;
window.renderAnnouncements = renderAnnouncements;

function loadDashboard() {
    console.log('loadDashboard called, currentUser:', window.currentUser || currentUser); // Debug log
    
    const user = window.currentUser || currentUser;
    if (!user) {
        console.error('No user found in loadDashboard!');
        return;
    }
    
    const role = user.role;
    const sidebar = document.getElementById('sidebar-menu');
    
    const menus = {
        student: [
            { name: '📊 Dashboard', view: 'studentDashboard' },
            { name: '📅 Mark Attendance', view: 'markMyAttendance' },
            { name: '📋 My Attendance', view: 'myAttendance' },
            { name: '💰 My Bills', view: 'myBills' },
            { name: '🔧 My Complaints', view: 'myComplaints' },
            { name: '📢 Announcements', view: 'announcements' }
        ],
        warden: [
            { name: '📊 Dashboard', view: 'wardenDashboard' },
            { name: '✅ Mark Attendance', view: 'markAttendance' },
            { name: '📋 Attendance Report', view: 'attendanceReport' },
            { name: '💰 Manage Bills', view: 'manageBills' },
            { name: '💵 Set Rates', view: 'setRates' },
            { name: '🔧 All Complaints', view: 'allComplaints' },
            { name: '📢 Announcements', view: 'manageAnnouncements' }
        ]
    };

    sidebar.innerHTML = '';
    menus[role].forEach((menu, index) => {
        const li = document.createElement('li');
        li.textContent = menu.name;
        li.onclick = () => {
            document.querySelectorAll('.sidebar li').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            loadView(menu.view);
        };
        if (index === 0) li.classList.add('active');
        sidebar.appendChild(li);
    });

    loadView(menus[role][0].view);
}

async function loadView(viewName) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<div class="spinner"></div>';

    try {
        switch(viewName) {
            case 'studentDashboard':
                await renderStudentDashboard();
                break;
            case 'markMyAttendance':
                renderMarkMyAttendance();
                break;
            case 'myAttendance':
                await renderMyAttendance();
                break;
            case 'myBills':
                await renderMyBills();
                break;
            case 'myComplaints':
                await renderMyComplaints();
                break;
            case 'wardenDashboard':
                await renderWardenDashboard();
                break;
            case 'markAttendance':
                await renderMarkAttendance();
                break;
            case 'attendanceReport':
                await renderAttendanceReport();
                break;
            case 'manageBills':
                await renderManageBills();
                break;
            case 'setRates':
                await renderSetRates();
                break;
            case 'allComplaints':
                await renderAllComplaints();
                break;
            case 'announcements':
            case 'manageAnnouncements':
                renderAnnouncements();
                break;
            default:
                contentArea.innerHTML = '<div class="empty-state"><h3>Coming Soon</h3><p>This feature is under development</p></div>';
        }
    } catch (error) {
        contentArea.innerHTML = `<div class="alert alert-error">Error loading content: ${error.message}</div>`;
    }
}

// ==================== STUDENT VIEWS ====================

async function renderStudentDashboard() {
    try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();

        // Fetch data in parallel
        const [attendanceResult, billsResult, complaintsResult] = await Promise.all([
            apiCall(`/attendance/my?month=${month}&year=${year}`),
            apiCall('/mess-bill/my'),
            apiCall('/complaints/my')
        ]);

        const currentBill = billsResult.bills.find(b => b.month === month && b.year === year);
        const activeComplaints = complaintsResult.complaints.filter(c => c.status !== 'resolved');
        
        const user = window.currentUser || currentUser;

        const html = `
            <div class="page-header">
                <h2>Welcome back, ${user.name}! 👋</h2>
                <p>Here's your hostel dashboard overview</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Present Days</h4>
                    <div class="stat-value">${attendanceResult.stats.present}</div>
                    <div class="stat-label">This month</div>
                </div>
                <div class="stat-card">
                    <h4>Absent Days</h4>
                    <div class="stat-value">${attendanceResult.stats.absent}</div>
                    <div class="stat-label">This month</div>
                </div>
                <div class="stat-card">
                    <h4>Room Number</h4>
                    <div class="stat-value">${user.roomNumber || 'N/A'}</div>
                    <div class="stat-label">Block ${user.hostelBlock || 'N/A'}</div>
                </div>
                <div class="stat-card">
                    <h4>Current Bill</h4>
                    <div class="stat-value">₹${currentBill ? currentBill.totalAmount : 0}</div>
                    <div class="stat-label">${currentBill ? currentBill.paymentStatus : 'Not generated'}</div>
                </div>
            </div>

            <div class="card">
                <h3>🔧 Active Complaints</h3>
                ${activeComplaints.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${activeComplaints.map(c => `
                                    <tr>
                                        <td><strong>${c.ticketId}</strong></td>
                                        <td><span class="badge badge-info">${c.category}</span></td>
                                        <td><span class="badge badge-${c.status === 'resolved' ? 'success' : c.status === 'in_progress' ? 'warning' : 'danger'}">${c.status.replace('_', ' ')}</span></td>
                                        <td>${formatDate(c.createdAt)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div class="empty-state"><p>No active complaints</p></div>'}
            </div>

            <div class="card">
                <h3>📊 Quick Actions</h3>
                <div class="flex gap-2">
                    <button class="btn" onclick="loadView('markMyAttendance')">Mark Today's Attendance</button>
                    <button class="btn btn-secondary" onclick="loadView('myComplaints')">Submit Complaint</button>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

function renderMarkMyAttendance() {
    const html = `
        <div class="page-header">
            <h2>📅 Mark Today's Attendance</h2>
            <p>Mark your attendance for ${formatDate(new Date())}</p>
        </div>
        
        <div class="card">
            <h3>Attendance Marking</h3>
            <form onsubmit="submitMyAttendance(event)">
                <div class="form-group">
                    <label>Status</label>
                    <select id="attendance-status" required>
                        <option value="present">✅ Present</option>
                        <option value="absent">❌ Absent</option>
                        <option value="late">⏰ Late Entry</option>
                        <option value="leave">🏖️ On Leave</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Remarks (Optional)</label>
                    <input type="text" id="attendance-remarks" placeholder="Any additional notes...">
                </div>
                <button type="submit" class="btn">Mark Attendance</button>
            </form>
        </div>

        <div class="card">
            <h3>ℹ️ Important Notes</h3>
            <ul style="padding-left: 20px; line-height: 2;">
                <li>You can mark attendance only once per day</li>
                <li>Attendance cannot be edited after marking</li>
                <li>Your mess bill will be calculated based on present days</li>
                <li>Contact warden if you need to correct attendance</li>
            </ul>
        </div>
    `;
    
    document.getElementById('content-area').innerHTML = html;
}

async function submitMyAttendance(event) {
    event.preventDefault();
    
    const data = {
        status: document.getElementById('attendance-status').value,
        remarks: document.getElementById('attendance-remarks').value
    };

    try {
        const result = await apiCall('/attendance/mark', 'POST', data);
        showAlert('Attendance marked successfully!', 'success');
        setTimeout(() => loadView('myAttendance'), 1000);
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function renderMyAttendance() {
    try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        
        const result = await apiCall(`/attendance/my?month=${month}&year=${year}`);
        
        const html = `
            <div class="page-header">
                <h2>📋 My Attendance Records</h2>
                <p>${today.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Present</h4>
                    <div class="stat-value" style="color: var(--success)">${result.stats.present}</div>
                </div>
                <div class="stat-card">
                    <h4>Absent</h4>
                    <div class="stat-value" style="color: var(--danger)">${result.stats.absent}</div>
                </div>
                <div class="stat-card">
                    <h4>Late</h4>
                    <div class="stat-value" style="color: var(--warning)">${result.stats.late}</div>
                </div>
                <div class="stat-card">
                    <h4>Leave</h4>
                    <div class="stat-value" style="color: var(--info)">${result.stats.leave}</div>
                </div>
            </div>
            
            <div class="card">
                <h3>Attendance Records</h3>
                ${result.attendance.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Marked At</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${result.attendance.map(a => `
                                    <tr>
                                        <td>${formatDate(a.date)}</td>
                                        <td><span class="badge badge-${a.status === 'present' ? 'success' : a.status === 'absent' ? 'danger' : 'warning'}">${a.status}</span></td>
                                        <td>${formatDateTime(a.markedAt)}</td>
                                        <td>${a.remarks || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div class="empty-state"><p>No attendance records for this month</p></div>'}
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function renderMyBills() {
    try {
        const result = await apiCall('/mess-bill/my');
        
        const html = `
            <div class="page-header">
                <h2>💰 My Mess Bills</h2>
                <p>View and track your mess billing history</p>
            </div>
            
            <div class="card">
                <h3>Billing History</h3>
                ${result.bills.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Month/Year</th>
                                    <th>Days</th>
                                    <th>Rate</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${result.bills.map(b => `
                                    <tr>
                                        <td><strong>${getMonthName(b.month)} ${b.year}</strong></td>
                                        <td>${b.totalDays} days</td>
                                        <td>₹${b.rate}/day</td>
                                        <td><strong>₹${b.totalAmount}</strong></td>
                                        <td><span class="badge badge-${b.paymentStatus === 'paid' ? 'success' : 'warning'}">${b.paymentStatus}</span></td>
                                        <td><button class="btn btn-sm" onclick="viewBillDetails('${b._id}')">View Details</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div class="empty-state"><p>No bills generated yet</p></div>'}
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

function getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
}

async function viewBillDetails(billId) {
    try {
        const result = await apiCall(`/mess-bill/${billId}`);
        const bill = result.bill;
        
        const modalHtml = `
            <div class="modal active" id="billModal" onclick="if(event.target === this) closeModal('billModal')">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Bill Details - ${getMonthName(bill.month)} ${bill.year}</h3>
                        <button class="modal-close" onclick="closeModal('billModal')">&times;</button>
                    </div>
                    <div>
                        <div style="margin-bottom: 20px;">
                            <p><strong>Student:</strong> ${bill.studentId.name}</p>
                            <p><strong>College ID:</strong> ${bill.studentId.collegeId}</p>
                            <p><strong>Room:</strong> ${bill.studentId.roomNumber}</p>
                        </div>
                        
                        <h4 style="margin-bottom: 16px;">Billing Details</h4>
                        <table style="margin-bottom: 24px;">
                            <tbody>
                                <tr>
                                    <td>Total Days Present</td>
                                    <td><strong>${bill.totalDays} days</strong></td>
                                </tr>
                                <tr>
                                    <td>Rate per Day</td>
                                    <td><strong>₹${bill.rate}</strong></td>
                                </tr>
                                <tr>
                                    <td>Subtotal</td>
                                    <td><strong>₹${bill.totalDays * bill.rate}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                        
                        ${bill.extraCharges && bill.extraCharges.length > 0 ? `
                            <h4 style="margin-bottom: 16px;">Extra Charges</h4>
                            <table style="margin-bottom: 24px;">
                                <tbody>
                                    ${bill.extraCharges.map(charge => `
                                        <tr>
                                            <td>${charge.description}</td>
                                            <td>₹${charge.amount}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : ''}
                        
                        ${bill.deductions && bill.deductions.length > 0 ? `
                            <h4 style="margin-bottom: 16px;">Deductions</h4>
                            <table style="margin-bottom: 24px;">
                                <tbody>
                                    ${bill.deductions.map(deduction => `
                                        <tr>
                                            <td>${deduction.description}</td>
                                            <td>-₹${deduction.amount}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : ''}
                        
                        <div style="text-align: right; padding: 16px; background: var(--light); border-radius: 8px;">
                            <h3>Total Amount: ₹${bill.totalAmount}</h3>
                            <p style="margin-top: 8px;">Status: <span class="badge badge-${bill.paymentStatus === 'paid' ? 'success' : 'warning'}">${bill.paymentStatus}</span></p>
                            ${bill.paidDate ? `<p style="margin-top: 4px; font-size: 14px;">Paid on: ${formatDate(bill.paidDate)}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
}

async function renderMyComplaints() {
    try {
        const result = await apiCall('/complaints/my');
        
        const html = `
            <div class="page-header flex-between">
                <div>
                    <h2>🔧 My Complaints</h2>
                    <p>Track and manage your maintenance requests</p>
                </div>
                <button class="btn" onclick="showNewComplaintForm()">+ New Complaint</button>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total</h4>
                    <div class="stat-value">${result.stats.total}</div>
                </div>
                <div class="stat-card">
                    <h4>Pending</h4>
                    <div class="stat-value" style="color: var(--danger)">${result.stats.pending}</div>
                </div>
                <div class="stat-card">
                    <h4>In Progress</h4>
                    <div class="stat-value" style="color: var(--warning)">${result.stats.inProgress}</div>
                </div>
                <div class="stat-card">
                    <h4>Resolved</h4>
                    <div class="stat-value" style="color: var(--success)">${result.stats.resolved}</div>
                </div>
            </div>
            
            <div class="card">
                <h3>Complaint History</h3>
                ${result.complaints.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${result.complaints.map(c => `
                                    <tr>
                                        <td><strong>${c.ticketId}</strong></td>
                                        <td><span class="badge badge-info">${c.category}</span></td>
                                        <td>${c.description.substring(0, 50)}${c.description.length > 50 ? '...' : ''}</td>
                                        <td><span class="badge badge-${c.status === 'resolved' ? 'success' : c.status === 'in_progress' ? 'warning' : 'danger'}">${c.status.replace('_', ' ')}</span></td>
                                        <td>${formatDate(c.createdAt)}</td>
                                        <td><button class="btn btn-sm" onclick="viewComplaintDetails('${c._id}')">View</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div class="empty-state"><p>No complaints submitted yet</p></div>'}
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

function showNewComplaintForm() {
    const html = `
        <div class="page-header">
            <h2>🔧 Submit New Complaint</h2>
            <p>Report any maintenance or facility issues</p>
        </div>
        
        <div class="card">
            <h3>Complaint Details</h3>
            <form onsubmit="submitComplaint(event)">
                <div class="form-group">
                    <label>Category</label>
                    <select id="complaint-category" required>
                        <option value="">Select category</option>
                        <option value="electrical">⚡ Electrical</option>
                        <option value="plumbing">🚰 Plumbing</option>
                        <option value="wifi">📶 Wi-Fi/Internet</option>
                        <option value="cleanliness">🧹 Cleanliness</option>
                        <option value="hostel">🏠 Hostel Facility</option>
                        <option value="mess">🍽️ Mess</option>
                        <option value="security">🔒 Security</option>
                        <option value="other">📝 Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Priority</label>
                    <select id="complaint-priority" required>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="complaint-description" rows="6" required placeholder="Please describe the issue in detail..." minlength="10"></textarea>
                </div>
                <div class="flex gap-2">
                    <button type="submit" class="btn">Submit Complaint</button>
                    <button type="button" class="btn btn-secondary" onclick="renderMyComplaints()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('content-area').innerHTML = html;
}

async function submitComplaint(event) {
    event.preventDefault();
    
    const data = {
        category: document.getElementById('complaint-category').value,
        description: document.getElementById('complaint-description').value,
        priority: document.getElementById('complaint-priority').value
    };

    try {
        const result = await apiCall('/complaints', 'POST', data);
        showAlert(`Complaint submitted successfully! Ticket ID: ${result.complaint.ticketId}`, 'success');
        setTimeout(() => renderMyComplaints(), 1000);
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function viewComplaintDetails(complaintId) {
    try {
        const result = await apiCall(`/complaints/${complaintId}`);
        const complaint = result.complaint;
        
        const modalHtml = `
            <div class="modal active" id="complaintModal" onclick="if(event.target === this) closeModal('complaintModal')">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Complaint Details</h3>
                        <button class="modal-close" onclick="closeModal('complaintModal')">&times;</button>
                    </div>
                    <div>
                        <p><strong>Ticket ID:</strong> ${complaint.ticketId}</p>
                        <p><strong>Category:</strong> <span class="badge badge-info">${complaint.category}</span></p>
                        <p><strong>Priority:</strong> <span class="badge badge-warning">${complaint.priority}</span></p>
                        <p><strong>Status:</strong> <span class="badge badge-${complaint.status === 'resolved' ? 'success' : complaint.status === 'in_progress' ? 'warning' : 'danger'}">${complaint.status.replace('_', ' ')}</span></p>
                        <p><strong>Submitted:</strong> ${formatDateTime(complaint.createdAt)}</p>
                        ${complaint.assignedTo ? `<p><strong>Assigned To:</strong> ${complaint.assignedTo.name}</p>` : ''}
                        ${complaint.resolvedAt ? `<p><strong>Resolved At:</strong> ${formatDateTime(complaint.resolvedAt)}</p>` : ''}
                        <hr style="margin: 20px 0;">
                        <p><strong>Description:</strong></p>
                        <p style="padding: 16px; background: var(--light); border-radius: 8px; margin-top: 8px;">${complaint.description}</p>
                        ${complaint.remarks ? `
                            <hr style="margin: 20px 0;">
                            <p><strong>Remarks:</strong></p>
                            <p style="padding: 16px; background: var(--light); border-radius: 8px; margin-top: 8px;">${complaint.remarks}</p>
                        ` : ''}
                        ${complaint.resolutionNotes ? `
                            <hr style="margin: 20px 0;">
                            <p><strong>Resolution Notes:</strong></p>
                            <p style="padding: 16px; background: #d1fae5; border-radius: 8px; margin-top: 8px;">${complaint.resolutionNotes}</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

function renderAnnouncements() {
    const html = `
        <div class="page-header">
            <h2>📢 Announcements</h2>
            <p>Stay updated with hostel notifications</p>
        </div>
        
        <div class="card">
            <div class="empty-state">
                <h3>No Announcements</h3>
                <p>Check back later for updates</p>
            </div>
        </div>
    `;
    
    document.getElementById('content-area').innerHTML = html;
}
