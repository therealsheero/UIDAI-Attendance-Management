# UIDAI Attendance & Leave Management Dashboard

## Overview
The UIDAI Attendance & Leave Management Dashboard is a web-based application designed to help employees apply for leaves and allow HR (or higher officials like Deputy Directors, Directors, and DDGs) to review, forward, approve, or reject these applications.

The project is built using a monolithic architecture with a Node.js (Express) backend, a SQLite database, and a vanilla HTML/CSS/JS frontend.

## Technology Stack
- **Backend:** Node.js, Express.js
- **Database:** SQLite3 (using `better-sqlite3` library)
- **Authentication:** JSON Web Tokens (JWT) & `bcryptjs` for password hashing
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Security:** `helmet` for HTTP headers, `cors` for Cross-Origin Resource Sharing

---

## Architecture & Directory Structure

```text
├── database/
│   └── init.js          # SQLite database initialization & schema definition
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── public/              # Static frontend assets
│   ├── css/             # Stylesheets
│   ├── js/              # Frontend JavaScript logic (auth.js, employee.js, hr.js, ddg.js)
│   ├── index.html       # Login Page
│   ├── register.html    # Employee Registration Page
│   ├── employee.html    # Employee Dashboard
│   ├── hr.html          # HR Dashboard (for DD / DIR)
│   └── ddg.html         # DDG Dashboard (for higher approvals)
├── routes/
│   ├── auth.js          # Authentication API routes
│   ├── hr.js            # HR / Admin API routes
│   └── leaves.js        # Employee Leave API routes
├── server.js            # Main Express server entry point
└── package.json         # Project dependencies & scripts
```

---

## Database Schema

The database `attendance.db` uses Write-Ahead Logging (WAL) for better concurrency and comprises two main tables:

### 1. `employees`
Stores user credentials and role information.
- `id` (INTEGER, Primary Key)
- `employee_id` (TEXT, Unique)
- `name` (TEXT)
- `password_hash` (TEXT)
- `role` (TEXT, default: 'employee') - Distinguishes between regular employees and 'hr'
- `created_at` (DATETIME)

### 2. `leaves`
Stores all leave applications and their current status.
- `id` (INTEGER, Primary Key)
- `employee_id` (TEXT, Foreign Key)
- `employee_name` (TEXT)
- `leave_type` (TEXT) - e.g., Tour, Casual Leave, Sick Leave, Earned Leave, etc.
- `from_date` (DATE)
- `to_date` (DATE)
- `reason` (TEXT)
- `district` (TEXT) - Specifically required for 'Tour' leaves
- `reporting_officer` (TEXT)
- `forwarding_officer` (TEXT)
- `current_stage` (TEXT) - Used for tracking the hierarchy (e.g., 'dd', 'dir', 'ddg')
- `status` (TEXT, default: 'pending') - e.g., pending, approved, rejected, cancelled
- `applied_on` (DATETIME)
- `action_by`, `action_by_name`, `action_on` - Audit trail of who approved/rejected the leave

---

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register`: Register a new employee account.
- `POST /login`: Authenticate an employee or HR and return a JWT token.

### Leave Management (Employee) (`/api/leaves`)
*Requires valid JWT Token.*
- `POST /`: Submit a new leave application.
- `GET /my`: Retrieve all leave applications submitted by the logged-in employee.
- `PATCH /:id/cancel`: Cancel a pending leave application.

### HR Management (`/api/hr`)
*Requires valid JWT Token & specific officer roles (dd, dir, ddg).*
- `GET /leaves`: Retrieve all leaves (DD/DIR) or specifically 'Tour' leaves pending at the DDG stage.
- `PATCH /forward/:id`: Forward a leave application to the next stage (DDG).
- `GET /leaves/date/:date`: Get all overlapping leaves for a specific date.
- `PATCH /leaves/:id`: Approve or reject a leave application.
- `GET /stats`: Retrieve leave statistics for the next 30 days and the current day.

---

## Roles and Workflow

### 1. Employee
- Registers an account.
- Logs in to the **Employee Dashboard**.
- Can apply for different types of leaves.
- If applying for a **Tour**, the `district` is required.
- Leaves are initially marked as `pending` and placed at a specific `current_stage` (e.g., 'dd' for Tours, 'dir' for others).
- Can cancel their leaves as long as they are still `pending`.

### 2. HR / Middle Management (DD / DIR)
- Logs in to the **HR Dashboard**.
- Can view all pending/approved/rejected leaves.
- Can directly **approve** or **reject** standard leaves.
- For specific workflows (like 'Tour'), they can **forward** the application to the DDG stage.

### 3. Higher Management (DDG)
- Logs in to the **DDG Dashboard**.
- Only sees leaves that have been explicitly forwarded to their stage (`current_stage = 'ddg'`).
- Can finally **approve** or **reject** these elevated applications.

---

## Running the Application

1. **Install Dependencies:**
   `
   npm install
   `

2. **Start the Server:**

   Development mode with nodemon
   `
   npm run dev
   `
   Production mode
   `
   npm start
   `

3. **Access the Application:**
   Open a web browser and navigate to \`http://localhost:3000\`.
   The database will automatically initialize and seed default HR accounts on the first run.

   ---

   ## Demo Images
   <img width="1902" height="899" alt="Home" src="https://github.com/user-attachments/assets/ab0a622d-104a-4940-ab08-44456d8868ba" />
   <img width="1909" height="907" alt="emp" src="https://github.com/user-attachments/assets/e2d8e6dc-7ab9-4168-b895-1f41848c36e5" />
   <img width="1911" height="909" alt="emp_leave" src="https://github.com/user-attachments/assets/31f5a9bf-fbc2-4e56-a863-0ff121e26906" />
   <img width="1916" height="913" alt="dir" src="https://github.com/user-attachments/assets/4b911294-f431-4651-a80d-67d3cf9e9be3" />
   <img width="1914" height="900" alt="dir_leave" src="https://github.com/user-attachments/assets/17e95d82-3040-493d-acaa-7faede6d3f1f" />



