# GERAMA Admin Dashboard Guide

## 🚀 Overview
The GERAMA Admin Dashboard is a comprehensive management system for monitoring and controlling all aspects of the academic resource platform.

## 🔐 Access Requirements

### Admin Credentials
- **Username**: `gerama_admin`
- **Password**: `GERAMA2026_admin!`
- **Alternative Admin Emails**: 
  - `gerama.uenr@gmail.com`
  - `admin@gerama.com`

### Access Methods
1. **Direct Access**: Navigate to `admin-dashboard.html`
2. **Security Check**: System verifies admin privileges using email whitelist
3. **Session Management**: Uses sessionStorage for login persistence

## 📊 Dashboard Features

### 1. Overview Section
- **Pending Materials**: Count of student uploads awaiting review
- **Contact Messages**: Number of contact form submissions
- **Assistance Requests**: Academic help requests from students
- **Active Users**: Total registered student accounts

### 2. Materials Management
- **View Submissions**: All student-uploaded materials with details
- **Approve/Reject**: One-click approval system
- **Status Tracking**: Pending → Approved/Rejected
- **File Information**: Course, Level, Program, Type, Filename

### 3. Contact Management
- **Message Center**: All contact form submissions
- **View Full Messages**: Complete message details
- **Mark Resolved**: Track response status
- **Email Integration**: Automatic email notifications

### 4. Academic Assistance
- **Tutor Assignment**: Match students with tutors
- **Request Tracking**: Monitor academic help requests
- **Course-Specific**: Filter by engineering discipline
- **Status Management**: Pending → Assigned → Resolved

### 5. Announcement System
- **Create Announcements**: Publish platform-wide notices
- **Priority Levels**: Normal, Important, Urgent
- **Active/Inactive Toggle**: Control announcement visibility
- **Date Management**: Timestamped publishing

## 📈 Data Flow & Storage

### LocalStorage Keys
```javascript
// Material Submissions
gerama_uploads[]

// Contact Messages  
gerama_contacts[]

// Assistance Requests
gerama_assistance_requests[]

// Announcements
gerama_announcements[]

// Admin Session
gerama_admin_logged_in (sessionStorage)
```

### Data Structure Examples

#### Material Submission
```javascript
{
  course: "Engineering Mathematics",
  level: "L100", 
  program: "Mechanical Engineering",
  type: "Books",
  fileName: "textbook.pdf",
  date: "2026-04-25T10:30:00.000Z",
  status: "pending" // pending | approved | rejected
}
```

#### Contact Message
```javascript
{
  name: "Student Name",
  email: "student@email.com", 
  message: "Need help with accessing materials",
  timestamp: "2026-04-25T14:22:00.000Z",
  status: "pending" // pending | resolved
}
```

#### Assistance Request
```javascript
{
  course: "Electrical Machines",
  challenge: "Understanding transformer principles",
  timestamp: "2026-04-25T16:45:00.000Z", 
  status: "pending" // pending | assigned | resolved
}
```

#### Announcement
```javascript
{
  title: "Mid-Semester Tutorials",
  message: "Comprehensive tutorial sessions starting next week",
  priority: "important", // normal | important | urgent
  date: "2026-04-25T09:15:00.000Z",
  active: true // true = visible, false = hidden
}
```

## 🎯 Admin Actions

### Material Management
1. **Review**: Click "View" to see full material details
2. **Approve**: Adds material to public resources library
3. **Reject**: Removes material with reason (optional)
4. **Bulk Actions**: Process multiple submissions efficiently

### Contact Management  
1. **Monitor**: Check new messages regularly
2. **Respond**: Mark as resolved after addressing
3. **Track**: Maintain response time records
4. **Email Integration**: Automatic notifications to admin email

### Academic Assistance
1. **Assign Tutors**: Match qualified tutors with requests
2. **Track Progress**: Monitor request resolution
3. **Course Matching**: Ensure tutor expertise alignment
4. **Follow Up**: Ensure student satisfaction

### Announcement Management
1. **Create**: Publish timely announcements
2. **Priority System**: Urgent announcements get prominence
3. **Toggle Visibility**: Activate/deactivate as needed
4. **Archive**: Maintain historical announcement records

## 🔧 Technical Implementation

### Security Features
- **Email Whitelist**: Only approved admin emails can access
- **Session Management**: Secure login persistence
- **Access Control**: Role-based permissions
- **Auto-Logout**: Session timeout protection

### Data Persistence
- **LocalStorage**: Client-side data storage
- **Real-time Updates**: Immediate UI refresh on changes
- **Data Validation**: Input sanitization and validation
- **Error Handling**: Graceful error recovery

### User Experience
- **Responsive Design**: Mobile-friendly interface
- **Visual Feedback**: Loading states and confirmations
- **Keyboard Navigation**: Accessibility support
- **Performance**: Fast loading and smooth interactions

## 📱 Mobile Responsiveness

The admin dashboard is fully responsive with:
- **Table Optimization**: Horizontal scrolling on small screens
- **Touch-Friendly**: Appropriate button sizes
- **Readable Layout**: Optimized for mobile viewing
- **Quick Actions**: Swipe-friendly interface elements

## 🔄 Best Practices

### Daily Operations
1. **Check Materials**: Review and approve pending uploads
2. **Monitor Contacts**: Respond to student inquiries
3. **Update Announcements**: Keep community informed
4. **Track Assistance**: Ensure academic support requests are handled

### Weekly Reviews
1. **Analytics Review**: Monitor platform usage statistics
2. **Content Audit**: Ensure quality and relevance
3. **User Feedback**: Review student satisfaction
4. **System Maintenance**: Update and optimize performance

## 🚨 Troubleshooting

### Common Issues
- **Login Problems**: Check credentials and admin email whitelist
- **Data Not Loading**: Verify localStorage availability
- **Button Actions**: Ensure JavaScript is enabled
- **Session Issues**: Clear browser cache and retry

### Support Contact
For technical issues with the admin dashboard:
- **Primary Email**: gerama.uenr@gmail.com
- **Developer**: Alexander O. Dwumaah
- **Documentation**: This guide file

---

## 📋 Quick Reference

### Admin Dashboard URL: `admin-dashboard.html`
### Default Credentials: `gerama_admin` / `GERAMA2026_admin!`
### Data Storage: LocalStorage (client-side)
### Session Management: sessionStorage
### Security: Email whitelist + session validation

**Note**: This dashboard provides complete administrative control over the GERAMA academic platform while maintaining security and user experience standards.
