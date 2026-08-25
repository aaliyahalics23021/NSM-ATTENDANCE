# AttendX — Smart Attendance Management System

**AttendX** is a secure, mobile-first attendance management system designed to simplify employee attendance through **facial verification, location-based validation, and centralized administration**.

**Live Website:** [AttendX](https://attendx-frontend-eight.vercel.app/)

---

##  Features

###  Employee Portal

* Secure employee registration
* Face-based identity verification
* GPS-based office geofencing
* Punch-in / punch-out
* Attendance history
* Working-hours calculation
* Verification records
* Mobile-friendly interface

###  Admin / HR Portal

* Secure administrator login
* Employee management
* Attendance dashboard
* Present / absent monitoring
* Attendance log management
* Attendance correction
* Office geofence configuration
* Face-data management
* Audit logs
* Excel attendance reports

##  Application Screenshots

###  Landing Page

The main entry point of AttendX.

![AttendX Landing Page](screenshot/01-landing-page.png)

---

###  Employee Registration

Employee registration interface.

![Employee Registration](screenshot/02-employee-registration.png)

---

###  Employee Login

Login interface for registered employees.

![Employee Login](screenshot/03-employee-login.png)

---

###  Face & Location Verification

Face and location verification before attendance.

![Face & Location Verification](screenshot/04-face-location-verification.png)

---

#  Admin Portal

###  Admin Login

Secure administrator login.

![Admin Login](screenshot/07-admin-login.png)

---

###  Admin Dashboard

Overview of attendance information.

![Admin Dashboard](screenshot/08-admin-dashboard.png)

---

###  Employee Management

Manage registered employees.

![Employee Management](screenshot/09-employee-management.png)

---

###  Attendance Logs

View employee attendance records.

![Attendance Logs](screenshot/10-attendance-logs.png)

---

###  Geofence Settings

Configure the attendance location boundary.

![Geofence Settings](screenshot/12-geofence-settings.png)

---

###  Verification Records

View attendance verification records.

![Verification Records](screenshot/13-verification-records.png)

---

###  Excel Attendance Report

Exported attendance report.

![Excel Attendance Report](screenshot/15-excel-report.png)


#  Technology Stack

| Layer             | Technologies                             |
| ----------------- | ---------------------------------------- |
| Frontend          | Next.js, React, TypeScript, Tailwind CSS |
| Backend           | Node.js, Express, TypeScript             |
| Database          | PostgreSQL, Prisma                       |
| Face Verification | Python, FastAPI, OpenCV                  |
| Authentication    | JWT, bcrypt                              |
| Reports           | ExcelJS                                  |
| Maps              | Leaflet                                  |

---

#  How AttendX Works

```text
Employee
   ↓
Authentication
   ↓
Face Verification
   ↓
Location Verification
   ↓
Attendance Recorded
   ↓
Admin Dashboard
   ↓
Attendance Reports
```

---

#  Security & Privacy

AttendX is designed with security and privacy in mind.

* Authentication-protected administrative functions
* Biometric verification for attendance
* Location validation
* Restricted administrative access
* Audit logging
* Secure environment-based configuration
* No sensitive credentials stored in the repository
 **Live Demo:** [attendx-frontend-eight.vercel.app](https://attendx-frontend-eight.vercel.app/)
