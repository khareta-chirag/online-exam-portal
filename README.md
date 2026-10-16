# Online Exam Portal

A full-stack Online Exam Website built with vanilla HTML/CSS/JavaScript, Node.js, Express.js and MongoDB/Mongoose.

## Features
- Student registration and login
- JWT authentication
- Student/admin roles
- Admin exam creation and deletion
- Publish/unpublish exams
- Timed exam attempts
- Server-side deadline validation
- Automatic scoring
- Result history
- Answer review
- Responsive UI

## Requirements
- Node.js 18+
- MongoDB local instance or MongoDB Atlas
- VS Code recommended

## Setup

### 1. Backend
```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and set `MONGO_URI` and a strong `JWT_SECRET`.

### 2. Create admin
```bash
npm run seed:admin
```
Default development admin:
- Email: `admin@examportal.com`
- Password: `Admin@123`

Change this password for any real deployment.

### 3. Start
```bash
npm run dev
```

Open http://localhost:5000

## Main API endpoints
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- GET `/api/exams`
- GET `/api/exams/:id`
- POST `/api/exams/:id/start`
- POST `/api/attempts/:id/submit`
- GET `/api/attempts/:id`
- GET `/api/exams/results/me`
- GET `/api/exams/admin/all`
- POST `/api/exams` (admin)
- PUT `/api/exams/:id` (admin)
- DELETE `/api/exams/:id` (admin)

## Architecture
Frontend -> Express routes -> Controllers -> Mongoose -> MongoDB

JWT is used for API authentication. The frontend stores the token in localStorage for this learning project; production systems should consider stronger token storage and additional security controls such as HTTPS, secure cookies, CSRF strategy where applicable, rate limiting, input validation and audit logging.
