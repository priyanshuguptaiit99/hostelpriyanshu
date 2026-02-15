// Make warden functions globally accessible
window.renderWardenDashboard = renderWardenDashboard;
window.renderMarkAttendance = renderMarkAttendance;
window.markStudentAttendance = markStudentAttendance;
window.viewTodayAttendance = viewTodayAttendance;
window.renderAttendanceReport = renderAttendanceReport;
window.renderManageBills = renderManageBills;
window.showGenerateBillsForm = showGenerateBillsForm;
window.generateAllBills = generateAllBills;
window.renderSetRates = renderSetRates;
window.setMessRate = setMessRate;
window.renderAllComplaints = renderAllComplaints;
window.filterComplaintsByStatus = filterComplaintsByStatus;
window.manageComplaint = manageComplaint;
window.updateComplaintStatus = updateComplaintStatus;

// ==================== WARDEN VIEWS ====================

async function renderWardenDashboard() {
    try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();

        // Fetch data in parallel
        const [todayResult, billSummary, complaintsResult] = await Promise.all([
            apiCall('/attendance/today'),
            apiCall(`/mess-bill/summary/${month}/${year}`).catch(() => ({ summary: { totalBills: 0, pendingCount: 0 } })),
            apiCall('/complaints')
        ]);

        const html = `
            <div class="page-header">
                <h2>Warden Dashboard 👨‍💼</h2>
                <p>Manage hostel operations and monitor activities</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total Students</h4>
                    <div class="stat-value">${todayResult.stats.totalStudents}</div>
                    <div class="stat-label">Registered</div>
                </div>
                <div class="stat-card">
                    <h4>Today Present</h4>
                    <div class="stat-value" style="color: var(--success)">${todayResult.stats.present}</div>
                    <div class="stat-label">Out of ${todayResult.stats.marked}</div>
                </div>
                <div class="stat-card">
                    <h4>Pending Complaints</h4>
                    <div class="stat-value" style="color: var(--warning)">${complaintsResult.stats.pending}</div>
                    <div class="stat-label">Need attention</div>
                </div>
                <div class="stat-card">
                    <h4>Pending Bills</h4>
                    <div class="stat-value" style="color: var(--danger)">${billSummary.summary.pendingCount}</div>
                    <div class="stat-label">Unpaid</div>
                </div>
            </div>

            <div class="card">
                <h3>📊 Today's Attendance Summary</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>Marked</h4>
                        <div class="stat-value">${todayResult.stats.marked}</div>
                    </div>
                    <div class="stat-card">
                        <h4>Not Marked</h4>
                        <div class="stat-value">${todayResult.stats.notMarked}</div>
                    </div>
                    <div class="stat-card">
                        <h4>Present</h4>
                        <div class="stat-value" style="color: var(--success)">${todayResult.stats.present}</div>
                    </div>
                    <div class="stat-card">
                        <h4>Absent</h4>
                        <div class="stat-value" style="color: var(--danger)">${todayResult.stats.absent}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>🔧 Recent Complaints</h3>
                ${complaintsResult.complaints.slice(0, 5).length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>Student</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${complaintsResult.complaints.slice(0, 5).map(c => `
                                    <tr>
                                        <td><strong>${c.ticketId}</strong></td>
                                        <td>${c.studentId ? c.studentId.name : 'N/A'}</td>
                                        <td><span class="badge badge-info">${c.category}</span></td>
                                        <td><span class="badge badge-${c.status === 'resolved' ? 'success' : c.status === 'in_progress' ? 'warning' : 'danger'}">${c.status.replace('_', ' ')}</span></td>
                                        <td>${formatDate(c.createdAt)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div class="empty-state"><p>No complaints</p></div>'}
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function renderMarkAttendance() {
    const html = `
        <div class="page-header">
            <h2>✅ Mark Attendance</h2>
            <p>Record student attendance</p>
        </div>
        
        <div class="card">
            <h3>Mark Attendance for Student</h3>
            <form onsubmit="markStudentAttendance(event)">
                <div class="form-group">
                    <label>Student College ID or Email</label>
                    <input type="text" id="att-student-identifier" required placeholder="CS2024001 or student@college.edu">
                    <small style="color: #6b7280;">Enter college ID or email to find student</small>
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="att-date" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="att-status" required>
                        <option value="present">✅ Present</option>
                        <option value="absent">❌ Absent</option>
                        <option value="late">⏰ Late Entry</option>
                        <option value="leave">🏖️ On Leave</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Remarks (Optional)</label>
                    <input type="text" id="att-remarks" placeholder="Any additional notes...">
                </div>
                <button type="submit" class="btn">Mark Attendance</button>
            </form>
        </div>

        <div class="card">
            <h3>📊 Today's Attendance</h3>
            <button class="btn btn-secondary" onclick="viewTodayAttendance()">View Today's Records</button>
        </div>
    `;
    
    document.getElementById('content-area').innerHTML = html;
}

async function markStudentAttendance(event) {
    event.preventDefault();
    
    const identifier = document.getElementById('att-student-identifier').value;
    
    // For now, show message that we need student ID
    // In production, you'd have an endpoint to search students by email/collegeId
    showAlert('Please provide the student ID directly. Student search feature coming soon.', 'info');
}

async function viewTodayAttendance() {
    try {
        const result = await apiCall('/attendance/today');
        
        const html = `
            <div class="page-header">
                <h2>� Today's Attendance</h2>
                <p>${formatDate(result.date)}</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total Students</h4>
                    <div class="stat-value">${result.stats.totalStudents}</div>
                </div>
                <div class="stat-card">
                    <h4>Marked</h4>
                    <div class="stat-value">${result.stats.marked}</div>
                </div>
                <div class="stat-card">
                    <h4>Present</h4>
                    <div class="stat-value" style="color: var(--success)">${result.stats.present}</div>
                </div>
                <div class="stat-card">
                    <h4>Absent</h4>
                    <div class="stat-value" style="color: var(--danger)">${result.stats.absent}</div>
                </div>
            </div>
            
            <div class="card">
                <div class="flex-between mb-3">
                    <h3>Attendance Records</h3>
                    <button class="btn btn-secondary" onclick="renderMarkAttendance()">Back</button>
                </div>
                ${result.attendance.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>College ID</th>
                                    <th>Room</th>
                                    <th>Status</th>
                                    <th>Marked At</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${result.attendance.map(a => `
                                    <tr>
                                        <td>${a.studentId.name}</td>
                                        <td>${a.studentId.collegeId}</td>
                                        <td>${a.studentId.roomNumber}</td>
                                        <td><span class="badge badge-${a.status === 'present' ? 'success' : 'danger'}">${a.status}</span></td>
                                        <td>${formatDateTime(a.markedAt)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div class="empty-state"><p>No attendance marked today</p></div>'}
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function renderAttendanceReport() {
    try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        
        const result = await apiCall(`/attendance/report?month=${month}&year=${year}`);
        
        const html = `
            <div class="page-header">
                <h2>📋 Attendance Report</h2>
                <p>${getMonthName(month)} ${year}</p>
            </div>

            <div class="card">
                <h3>Monthly Attendance Report</h3>
                <p style="margin-bottom: 20px;">Total Students: ${result.totalStudents}</p>
                ${result.report.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>College ID</th>
                                    <th>Room</th>
                                    <th>Present</th>
                                    <th>Absent</th>
                                    <th>Total</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${result.report.map(r => `
                                    <tr>
                                        <td>${r.student.name}</td>
                                        <td>${r.student.collegeId}</td>
                                        <td>${r.student.roomNumber}</td>
                                        <td><span class="badge badge-success">${r.attendance.present}</span></td>
                                        <td><span class="badge badge-danger">${r.attendance.absent}</span></td>
                                        <td>${r.attendance.total}</td>
                                        <td><strong>${r.attendance.percentage}%</strong></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div class="empty-state"><p>No attendance data available</p></div>'}
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function renderManageBills() {
    try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        
        const result = await apiCall(`/mess-bill/summary/${month}/${year}`).catch(() => ({ 
            summary: { totalBills: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 },
            bills: []
        }));
        
        const html = `
            <div class="page-header">
                <h2>💰 Manage Mess Bills</h2>
                <p>${getMonthName(month)} ${year}</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total Bills</h4>
                    <div class="stat-value">${result.summary.totalBills}</div>
                </div>
                <div class="stat-card">
                    <h4>Total Amount</h4>
                    <div class="stat-value">₹${result.summary.totalAmount}</div>
                </div>
                <div class="stat-card">
                    <h4>Paid Amount</h4>
                    <div class="stat-value" style="color: var(--success)">₹${result.summary.paidAmount}</div>
                </div>
                <div class="stat-card">
                    <h4>Pending Amount</h4>
                    <div class="stat-value" style="color: var(--danger)">₹${result.summary.pendingAmount}</div>
                </div>
            </div>
            
            <div class="card">
                <div class="flex-between mb-3">
                    <h3>Bill Management</h3>
                    <button class="btn" onclick="showGenerateBillsForm()">Generate Bills</button>
                </div>
                ${result.bills.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>College ID</th>
                                    <th>Days</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${result.bills.map(b => `
                                    <tr>
                                        <td>${b.studentId.name}</td>
                                        <td>${b.studentId.collegeId}</td>
                                        <td>${b.totalDays}</td>
                                        <td>₹${b.totalAmount}</td>
                                        <td><span class="badge badge-${b.paymentStatus === 'paid' ? 'success' : 'warning'}">${b.paymentStatus}</span></td>
                                        <td><button class="btn btn-sm" onclick="viewBillDetails('${b._id}')">View</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div class="empty-state"><p>No bills generated for this month</p></div>'}
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

function showGenerateBillsForm() {
    const today = new Date();
    const html = `
        <div class="page-header">
            <h2>💰 Generate Mess Bills</h2>
            <p>Generate bills for all students</p>
        </div>
        
        <div class="card">
            <h3>Bulk Bill Generation</h3>
            <form onsubmit="generateAllBills(event)">
                <div class="form-group">
                    <label>Month</label>
                    <select id="bill-month" required>
                        ${Array.from({length: 12}, (_, i) => `
                            <option value="${i + 1}" ${i + 1 === today.getMonth() + 1 ? 'selected' : ''}>
                                ${getMonthName(i + 1)}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Year</label>
                    <input type="number" id="bill-year" required value="${today.getFullYear()}">
                </div>
                <div class="alert alert-info">
                    <p>This will generate bills for all students based on their attendance records.</p>
                    <p>Bills will be calculated as: Total Days × Daily Rate</p>
                </div>
                <div class="flex gap-2">
                    <button type="submit" class="btn">Generate All Bills</button>
                    <button type="button" class="btn btn-secondary" onclick="renderManageBills()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('content-area').innerHTML = html;
}

async function generateAllBills(event) {
    event.preventDefault();
    
    const data = {
        month: parseInt(document.getElementById('bill-month').value),
        year: parseInt(document.getElementById('bill-year').value)
    };

    try {
        const result = await apiCall('/mess-bill/generate-all', 'POST', data);
        showAlert(`Bills generated! Success: ${result.summary.generated}, Failed: ${result.summary.failed}, Skipped: ${result.summary.skipped}`, 'success');
        setTimeout(() => renderManageBills(), 2000);
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function renderSetRates() {
    try {
        const result = await apiCall('/mess-rate').catch(() => ({ rates: [] }));
        
        const html = `
            <div class="page-header">
                <h2>💵 Mess Rate Management</h2>
                <p>Configure monthly mess rates</p>
            </div>
            
            <div class="card">
                <h3>Set New Rate</h3>
                <form onsubmit="setMessRate(event)">
                    <div class="form-group">
                        <label>Month</label>
                        <select id="rate-month" required>
                            ${Array.from({length: 12}, (_, i) => `
                                <option value="${i + 1}">${getMonthName(i + 1)}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Year</label>
                        <input type="number" id="rate-year" required value="${new Date().getFullYear()}">
                    </div>
                    <div class="form-group">
                        <label>Daily Rate (₹)</label>
                        <input type="number" id="rate-daily" required value="100" min="0">
                    </div>
                    <div class="form-group">
                        <label>Remarks (Optional)</label>
                        <input type="text" id="rate-remarks" placeholder="e.g., Standard rate for the month">
                    </div>
                    <button type="submit" class="btn">Set Rate</button>
                </form>
            </div>

            <div class="card">
                <h3>Rate History</h3>
                ${result.rates.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Month/Year</th>
                                    <th>Daily Rate</th>
                                    <th>Set By</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${result.rates.map(r => `
                                    <tr>
                                        <td><strong>${getMonthName(r.month)} ${r.year}</strong></td>
                                        <td>₹${r.dailyRate}</td>
                                        <td>${r.setBy ? r.setBy.name : 'N/A'}</td>
                                        <td>${formatDate(r.createdAt)}</td>
                                        <td><span class="badge badge-${r.isActive ? 'success' : 'secondary'}">${r.isActive ? 'Active' : 'Inactive'}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div class="empty-state"><p>No rates configured yet</p></div>'}
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function setMessRate(event) {
    event.preventDefault();
    
    const data = {
        month: parseInt(document.getElementById('rate-month').value),
        year: parseInt(document.getElementById('rate-year').value),
        dailyRate: parseInt(document.getElementById('rate-daily').value),
        remarks: document.getElementById('rate-remarks').value
    };

    try {
        await apiCall('/mess-rate', 'POST', data);
        showAlert('Mess rate set successfully!', 'success');
        setTimeout(() => renderSetRates(), 1000);
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function renderAllComplaints() {
    try {
        const result = await apiCall('/complaints');
        
        const html = `
            <div class="page-header">
                <h2>🔧 All Complaints</h2>
                <p>Manage and resolve student complaints</p>
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
                <div class="flex-between mb-3">
                    <h3>Complaint List</h3>
                    <select onchange="filterComplaintsByStatus(this.value)" style="padding: 8px 16px; border-radius: 8px; border: 2px solid var(--border);">
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
                ${result.complaints.length > 0 ? `
                    <div class="table-container">
                        <table id="complaintsTable">
                            <thead>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>Student</th>
                                    <th>Room</th>
                                    <th>Category</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${result.complaints.map(c => `
                                    <tr data-status="${c.status}">
                                        <td><strong>${c.ticketId}</strong></td>
                                        <td>${c.studentId ? c.studentId.name : 'N/A'}</td>
                                        <td>${c.studentId ? c.studentId.roomNumber : 'N/A'}</td>
                                        <td><span class="badge badge-info">${c.category}</span></td>
                                        <td><span class="badge badge-warning">${c.priority}</span></td>
                                        <td><span class="badge badge-${c.status === 'resolved' ? 'success' : c.status === 'in_progress' ? 'warning' : 'danger'}">${c.status.replace('_', ' ')}</span></td>
                                        <td>${formatDate(c.createdAt)}</td>
                                        <td><button class="btn btn-sm" onclick="manageComplaint('${c._id}')">Manage</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div class="empty-state"><p>No complaints found</p></div>'}
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = html;
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

function filterComplaintsByStatus(status) {
    const rows = document.querySelectorAll('#complaintsTable tbody tr');
    rows.forEach(row => {
        if (status === 'all' || row.dataset.status === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

async function manageComplaint(complaintId) {
    try {
        const result = await apiCall(`/complaints/${complaintId}`);
        const complaint = result.complaint;
        
        const modalHtml = `
            <div class="modal active" id="manageComplaintModal" onclick="if(event.target === this) closeModal('manageComplaintModal')">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Manage Complaint - ${complaint.ticketId}</h3>
                        <button class="modal-close" onclick="closeModal('manageComplaintModal')">&times;</button>
                    </div>
                    <div>
                        <p><strong>Student:</strong> ${complaint.studentId.name} (${complaint.studentId.collegeId})</p>
                        <p><strong>Room:</strong> ${complaint.studentId.roomNumber}</p>
                        <p><strong>Phone:</strong> ${complaint.studentId.phoneNumber || 'N/A'}</p>
                        <p><strong>Category:</strong> <span class="badge badge-info">${complaint.category}</span></p>
                        <p><strong>Priority:</strong> <span class="badge badge-warning">${complaint.priority}</span></p>
                        <p><strong>Current Status:</strong> <span class="badge badge-${complaint.status === 'resolved' ? 'success' : 'warning'}">${complaint.status.replace('_', ' ')}</span></p>
                        <hr style="margin: 20px 0;">
                        <p><strong>Description:</strong></p>
                        <p style="padding: 16px; background: var(--light); border-radius: 8px; margin-bottom: 20px;">${complaint.description}</p>
                        
                        <form onsubmit="updateComplaintStatus(event, '${complaintId}')">
                            <div class="form-group">
                                <label>Update Status</label>
                                <select id="complaint-new-status" required>
                                    <option value="pending" ${complaint.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="in_progress" ${complaint.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="resolved" ${complaint.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Remarks</label>
                                <textarea id="complaint-remarks" rows="3" placeholder="Add remarks about this update...">${complaint.remarks || ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label>Resolution Notes (if resolved)</label>
                                <textarea id="complaint-resolution" rows="3" placeholder="Describe how the issue was resolved...">${complaint.resolutionNotes || ''}</textarea>
                            </div>
                            <button type="submit" class="btn">Update Complaint</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function updateComplaintStatus(event, complaintId) {
    event.preventDefault();
    
    const data = {
        status: document.getElementById('complaint-new-status').value,
        remarks: document.getElementById('complaint-remarks').value,
        resolutionNotes: document.getElementById('complaint-resolution').value
    };

    try {
        await apiCall(`/complaints/${complaintId}`, 'PUT', data);
        showAlert('Complaint updated successfully!', 'success');
        closeModal('manageComplaintModal');
        renderAllComplaints();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}
