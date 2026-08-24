# AttendX — Smart Attendance Management System

**AttendX** is a secure, mobile-first attendance management system designed to simplify employee attendance through **facial verification, location-based validation, and centralized administration**.

🌐 **Live Website:** [AttendX](https://attendx-frontend-eight.vercel.app/)

---

## ✨ Features

### 👤 Employee Portal

* Secure employee registration
* Face-based identity verification
* GPS-based office geofencing
* Punch-in / punch-out
* Attendance history
* Working-hours calculation
* Verification records
* Mobile-friendly interface

### 🛡️ Admin / HR Portal

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

---

# 📸 Application Screenshots

## 🏠 Landing Page

<!-- ADD SCREENSHOT HERE -->

`![AttendX Landing Page](screenshot/01-landing-page.png)`

Brief introduction to AttendX and navigation to the employee/admin portals.

---

## 👤 Employee Registration

<!-- ADD SCREENSHOT HERE -->

`![Employee Registration](screenshot/02-employee-registration.png)`

Employee registration interface with required identity and biometric verification steps.

---

## 🔐 Employee Login

<!-- ADD SCREENSHOT HERE -->

`![Employee Login](screenshot/03-employee-login.png)`

Employee authentication before accessing attendance features.

---

## 📍 Location & Face Verification

<!-- ADD SCREENSHOT HERE -->

`![Face and Location Verification](screenshot/04-face-location-verification.png)`

Attendance verification using facial identity and permitted workplace location.

> 🔒 **Privacy:** Screenshots should contain only dummy/test information. Do not upload real faces, phone numbers, GPS coordinates, employee names, or biometric data.

---

## 🕘 Employee Dashboard

<!-- ADD SCREENSHOT HERE -->

`![Employee Dashboard](screenshot/05-employee-dashboard.png)`

Displays attendance status, punch-in/punch-out information and working hours.

---

## 📅 Attendance History

<!-- ADD SCREENSHOT HERE -->

`![Attendance History](screenshot/06-attendance-history.png)`

Employee attendance records presented in an easy-to-read format.

---

# 🧑‍💼 Admin Panel

## 🔑 Admin Login

<!-- ADD SCREENSHOT HERE -->

`![Admin Login](screenshot/07-admin-login.png)`

Protected administrator authentication.

---

## 📊 Admin Dashboard

<!-- ADD SCREENSHOT HERE -->

`![Admin Dashboard](screenshot/08-admin-dashboard.png)`

Centralized overview of attendance statistics and employee activity.

---

## 👥 Employee Management

<!-- ADD SCREENSHOT HERE -->

`![Employee Management](screenshot/09-employee-management.png)`

Administrators can view and manage registered employees.

---

## 📝 Attendance Logs

<!-- ADD SCREENSHOT HERE -->

`![Attendance Logs](screenshot/10-attendance-logs.png)`

Detailed attendance records with punch-in, punch-out and attendance status.

---

## 🛠️ Attendance Management

<!-- ADD SCREENSHOT HERE -->

`![Attendance Management](screenshot/11-attendance-management.png)`

Authorized administrators can review and make necessary attendance corrections.

---

## 📍 Geofence / Office Settings

<!-- ADD SCREENSHOT HERE -->

`![Geofence Settings](screenshot/12-geofence-settings.png)`

Configuration interface for the permitted workplace location and attendance radius.

---

## 🧾 Verification Records

<!-- ADD SCREENSHOT HERE -->

`![Verification Records](screenshot/13-verification-records.png)`

Administrative view of attendance verification records.

---

## 📜 Audit Logs

<!-- ADD SCREENSHOT HERE -->

`![Audit Logs](screenshot/14-audit-logs.png)`

Tracks important administrative actions for accountability and monitoring.

---

## 📊 Excel Attendance Report

<!-- ADD SCREENSHOT HERE -->

`![Excel Attendance Report](screenshot/15-excel-report.png)`

Attendance data can be exported into a structured Excel report for organizational record keeping.

---


# ⚙️ Technology Stack

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

# 🔄 How AttendX Works

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

# 🔐 Security & Privacy

AttendX is designed with security and privacy in mind.

* Authentication-protected administrative functions
* Biometric verification for attendance
* Location validation
* Restricted administrative access
* Audit logging
* Secure environment-based configuration
* No sensitive credentials stored in the repository

### ⚠️ Public Repository Guidelines

**Never commit:**

```text
.env
.env.local
API keys
JWT secrets
Database credentials
Admin credentials / secret codes
Real employee information
Real phone numbers
Real faces or biometric data
Real GPS coordinates
Private API endpoints
```

All screenshots included in this README should use **dummy or anonymized data**.

---

# 📱 Responsive Design

AttendX is designed primarily for mobile attendance usage while maintaining a responsive administrator interface for desktop and mobile screens.

<!-- ADD MOBILE SCREENSHOT HERE -->

`![Mobile View](screenshots/17-mobile-view.png)`

---

# 🚀 Project Structure

```text
NSM-attendance/
├── frontend/
├── backend/
├── face-service/
├── screenshots/
└── README.md
```

---

# 👩‍💻 Project

**AttendX — Smart Attendance Management System**

Developed as a modern attendance solution combining **biometric verification, geofencing, secure authentication, attendance management and reporting**.

🌐 **Live Demo:** [attendx-frontend-eight.vercel.app](https://attendx-frontend-eight.vercel.app/)
