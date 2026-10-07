# 🎓 GERAMA Vacation Classes - Setup & User Guide

## 📋 Overview
Complete vacation classes management system with daily schedule display, timetable images, and admin controls.

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Create Database Tables
Run this SQL in your Supabase SQL Editor:

```bash
# Copy and run vacation-classes-schedule.sql
```

This creates:
- ✅ `vacation_classes` table - stores all class schedules
- ✅ `vacation_schedule_settings` table - stores timetable images and settings
- ✅ Sample data for Week 1 (October 6-11, 2026)
- ✅ Useful views: `todays_classes`, `upcoming_classes`, `this_week_schedule`

### Step 2: Create Storage Bucket for Timetable Images
Run this SQL in your Supabase SQL Editor:

```bash
# Copy and run setup-vacation-storage.sql
```

This creates:
- ✅ `timetables` storage bucket (public)
- ✅ Policies for upload, read, update, delete

### Step 3: Deploy to Vercel
Your changes are already committed and pushed! Vercel will auto-deploy.

---

## 📁 Files Created

### Public Pages
1. **vacation-classes.html** - Main vacation classes page
   - Shows today's classes
   - Weekly schedule with filters (Week 1, 2, 3)
   - Full timetable images display
   - Color-coded class cards
   - Join class buttons with meeting links

### Admin Pages
2. **admin-vacation-classes.html** - Admin management panel
   - ➕ Add new classes
   - 📋 Manage all classes
   - 🖼️ Upload timetable images (Week 1, 2, 3)
   - ⚙️ Configure settings (dates, welcome message)

### Components
3. **js/vacation-classes-widget.js** - Homepage widget
   - Auto-displays today's classes on homepage
   - Inserts after announcements section
   - Links to full vacation classes page

### Database
4. **vacation-classes-schedule.sql** - Database schema
5. **setup-vacation-storage.sql** - Storage bucket setup

---

## 🎯 Features

### For Students
✅ See today's classes at a glance
✅ View weekly schedule with filters
✅ See timetable images
✅ One-click join class links
✅ Color-coded courses
✅ Level badges (L100, L200, L300, L400)
✅ Mobile-responsive design

### For Admins
✅ Add/edit/delete classes
✅ Upload timetable images (Week 1, 2, 3)
✅ Set welcome messages
✅ Configure schedule dates
✅ Color-code classes for easy identification
✅ Target specific levels

---

## 📖 How to Use (Admin)

### Adding a New Class

1. Go to **Admin Dashboard** → **Vacation Classes** (opens new tab)
2. Fill in the form:
   - Course Name (required): e.g., "Solid State"
   - Course Code (optional): e.g., "EEE301"
   - Class Date (required): Select date
   - Week Number: 1, 2, or 3
   - Start Time & End Time: Default 7:30 PM - 9:00 PM
   - Tutor Names: e.g., "zANDEROD & Perry"
   - Meeting Link: Google Meet or classroom link
   - Target Levels: Check L100, L200, L300, L400
   - Color Code: Choose a color for the class card
   - Notes: Any additional info
3. Click **➕ Add Class**

### Uploading Timetable Images

1. Go to **Vacation Classes** → **Upload Timetable** tab
2. Click or drag-and-drop an image for:
   - Week 1 Timetable
   - Week 2 Timetable
   - Week 3 Timetable
3. Images are automatically uploaded and displayed on the public page

### Managing Classes

1. Go to **Manage Classes** tab
2. View all scheduled classes
3. Delete classes if needed

### Settings

1. Go to **Settings** tab
2. Configure:
   - Schedule Name: e.g., "GERAMA/26 Vacation Classes"
   - Start Date & End Date
   - Welcome Message (shown on public page)
   - Important Notes

---

## 🎨 Database Schema

### vacation_classes Table
```
- id (primary key)
- course_name (text, required)
- course_code (text)
- class_date (date, required)
- start_time (time, required)
- end_time (time, required)
- week_number (integer: 1, 2, or 3)
- day_of_week (text: Monday, Tuesday, etc.)
- tutor_names (text, required)
- meeting_link (text)
- target_levels (array: L100, L200, L300, L400)
- color_code (text: hex color)
- status (text: scheduled, ongoing, completed, cancelled)
- is_active (boolean)
- notes (text)
```

### vacation_schedule_settings Table
```
- id (primary key)
- schedule_name (text)
- start_date (date)
- end_date (date)
- timetable_image_week1 (text: URL)
- timetable_image_week2 (text: URL)
- timetable_image_week3 (text: URL)
- welcome_message (text)
- important_notes (text)
- is_current (boolean)
```

---

## 🔗 Navigation Updates

### Homepage (index.html)
- Added **Vacation Classes** link in main navigation
- Added **Today's Classes Widget** after announcements

### Admin Dashboard (admin-dashboard.html)
- Added **Vacation Classes** link in sidebar
- Opens in new tab for easy management

---

## 📱 Mobile Responsive

All pages are fully responsive:
- Homepage widget: Auto-adjusts on mobile
- Vacation classes page: Single column on mobile
- Admin panel: Stacks forms on mobile
- Touch-friendly buttons and navigation

---

## 🎨 Color Scheme

The system uses color-coding for better organization:
- **Orange/Amber gradient** - Today's classes section
- **Custom colors** - Each class can have its own color
- **Indigo** - Default class color
- **Level badges** - Light indigo background

Suggested colors for courses:
- 🔴 Red (#ef4444) - Hardware/Electronics courses
- 🟠 Orange (#f59e0b) - Power/Machines courses
- 🟢 Green (#10b981) - Circuits/Analysis courses
- 🔵 Blue (#3b82f6) - Software/Programming courses
- 🟣 Purple (#8b5cf6) - Mathematics courses

---

## 📊 Sample Data Included

Week 1 schedule (Oct 6-11, 2026) is pre-populated:
- **Tuesday**: Solid State (7:30-9:00 PM)
- **Wednesday**: DC Machines & Transformers (7:30-8:30 PM)
- **Thursday**: Electrical Circuits Analysis (7:30-9:00 PM)
- **Friday**: MATLAB (7:30-8:30 PM)
- **Saturday**: DC Machines (7:00-8:00 PM) + Solid State (8:05-9:00 PM)
- **Sunday**: Linear Algebra (7:30-9:00 PM)

---

## 🔧 Troubleshooting

### Classes not showing?
1. Check if `vacation_classes` table exists in Supabase
2. Verify RLS policies allow public SELECT
3. Check browser console for errors
4. Make sure `is_active = true` for classes

### Widget not appearing on homepage?
1. Clear browser cache
2. Check if `js/vacation-classes-widget.js` is loaded
3. Verify Supabase connection in `js/env-config.js`
4. Check browser console for errors

### Can't upload timetable images?
1. Verify `timetables` storage bucket exists in Supabase
2. Check bucket is set to public
3. Verify storage policies allow authenticated upload
4. Check file size (max 5MB)
5. Ensure user is logged in as admin

### Today's classes not showing?
1. Verify class date matches today's date (YYYY-MM-DD format)
2. Check `is_active = true`
3. Verify time zone settings

---

## 🎯 Next Steps

### Week 2 & 3 Schedule
Add more classes for Week 2 and Week 3 using the admin panel.

### Notifications
Consider adding push notifications for daily class reminders.

### Attendance Tracking
Link with existing attendance system in admin dashboard.

### Class Recordings
Add field for recording links after classes end.

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Verify database tables exist
3. Check browser console for errors
4. Review SQL execution logs in Supabase

---

## ✅ Deployment Status

- ✅ Code committed to GitHub (commit 9892fd3)
- ✅ Pushed to main branch
- ⏳ Vercel auto-deployment in progress
- 📝 Database setup required (run SQL scripts)

---

## 🎉 You're All Set!

Once you run the SQL scripts in Supabase:
1. Visit https://gerama-portal.vercel.app to see the widget on homepage
2. Visit https://gerama-portal.vercel.app/vacation-classes.html for full page
3. Go to Admin Dashboard → Vacation Classes to manage

**Happy teaching! 🎓**
