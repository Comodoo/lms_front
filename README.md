# College LMS - Student Management System

A comprehensive College Student Management System built for educational institutions. The system focuses on two core modules: Student Registration with Payments and Academic Results Management, with full CRUD functionality for Students, Instructors, and Administrators.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Core Features](#core-features)
- [Authentication & Access Control](#authentication--access-control)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

College LMS is a full-featured Student Management System designed for educational institutions. It supports three user roles (Students, Instructors, and Admins) and includes comprehensive features for student registration with payment processing and academic results management.

### Key Highlights

- **Student Registration**: Multi-step registration form with document upload and payment integration
- **Payment Processing**: Support for multiple payment methods including M-Pesa, Card, Bank Transfer, and Cash
- **Results Management**: Full CRUD operations for exam and semester results
- **Grade Calculations**: Automatic GPA and CGPA calculations with continuation tracking
- **Role-Based Access**: Three distinct portals for Students, Instructors, and Administrators
- **Mobile-First Design**: Responsive layouts optimized for all devices
- **Real-Time Updates**: React Context API for state management
- **Type-Safe**: Built with TypeScript for type safety

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS 4.0 |
| UI Components | shadcn/ui + Radix UI |
| State Management | React Context API |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Date Handling | date-fns |

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/college-lms.git
cd college-lms

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database (when integrating with backend)
NEXT_PUBLIC_API_URL=your_api_url

# Payment Providers
MPESA_CONSUMER_KEY=your_mpesa_key
MPESA_CONSUMER_SECRET=your_mpesa_secret
```

---

## Project Structure

```
college-lms/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/               # Login page
│   │   ├── signup/              # Registration page
│   │   └── forgot-password/     # Password reset
│   ├── (student)/               # Student portal
│   │   ├── dashboard/           # Student home
│   │   ├── registration/        # Student registration form
│   │   │   └── [id]/payment/    # Registration payment flow
│   │   ├── results/             # Academic results viewing
│   │   ├── profile/             # Student profile
│   │   └── settings/            # Account settings
│   ├── instructor/              # Instructor portal
│   │   ├── dashboard/           # Instructor dashboard
│   │   ├── results/             # Results management (CRUD)
│   │   │   └── [id]/            # Result detail/edit
│   │   ├── profile/             # Instructor profile
│   │   └── settings/            # Account settings
│   ├── admin/                   # Administration portal
│   │   ├── dashboard/           # Admin dashboard
│   │   ├── registrations/       # Registration management
│   │   │   └── [id]/            # Registration detail/edit
│   │   ├── results/             # Academic performance monitoring
│   │   │   └── [id]/            # Student detail view
│   │   ├── security/            # Security dashboard
│   │   ├── profile/             # Admin profile
│   │   └── settings/            # Platform settings
├── components/
│   ├── ui/                      # shadcn/ui components
│   └── shared/                  # Shared components
│       ├── theme-toggle.tsx
│       └── notifications-dropdown.tsx
├── lib/
│   ├── college-types.ts         # College system type definitions
│   ├── db/college-schema.ts     # Database schema interfaces
│   ├── auth-context.tsx         # Authentication with role-based access
│   ├── registration-context.tsx # Registration state management
│   ├── results-context.tsx      # Results state management
│   └── utils.ts                 # Utility functions
└── public/                      # Static assets
```

---

## User Roles

### 1. Student

Primary learner role with access to:

- **Registration**: Complete multi-step registration form with document upload
- **Payment**: Complete registration payment via M-Pesa, Card, Bank Transfer, or Cash
- **Results**: View academic results, GPA, CGPA, and semester history
- **Profile**: Manage personal information and settings
- **Dashboard**: Overview of registration status and academic performance

### 2. Instructor

Faculty role with access to:

- **Results Management**: Upload, edit, and manage exam results
- **Grade Calculations**: Automatic grade calculation based on scores
- **Result Approval**: Submit results for admin approval
- **Student Tracking**: View assigned students and their progress
- **Dashboard**: Overview of result management tasks

### 3. Administrator

System administrator with full access to:

- **Registration Management**: View, approve, reject, and manage student registrations
- **Results Monitoring**: Track all student academic performance
- **Continuation Tracking**: Monitor student continuation status (Good Standing, Probation, Discontinued)
- **GPA Analysis**: View yearly GPA trends and academic performance
- **Platform Settings**: Configure system-wide settings
- **Security**: Manage user accounts and access control

---

## Core Features

### Registration Module

- **Multi-Step Form**: 5-step registration process with validation
  - Personal Information (name, email, phone, national ID)
  - Academic Background (previous education, qualifications)
  - Program Selection (program, department, intake, study mode)
  - Guardian Information (parent/guardian details)
  - Document Upload (certificates, ID, photos)

- **Document Upload**: Support for multiple file types (PDF, JPG, PNG)
- **Payment Processing**: Integration with multiple payment methods
  - M-Pesa (mobile money)
  - Card Payment (Visa, Mastercard)
  - Bank Transfer
  - Cash (campus finance office)

- **Admin Management**:
  - View all registrations with search and filters
  - Approve or reject registrations with reasons
  - Edit registration details
  - View uploaded documents
  - Track payment status

### Results Module

- **Student View**:
  - View academic results by academic year and semester
  - Display GPA and CGPA
  - View semester history
  - Download transcripts
  - Grade scale reference

- **Instructor Management**:
  - Create and edit exam results
  - Automatic grade calculation based on scores
  - Submit results for approval
  - View and manage all assigned results
  - Track result status (draft, submitted, approved, rejected)

- **Admin Monitoring**:
  - Track all student academic performance
  - View yearly GPA trends
  - Monitor continuation status
  - Academic performance statistics
  - Student detail views with full academic history
  - Export reports

### Grade System

| Score Range | Grade | Grade Points |
|-------------|-------|--------------|
| 70-100      | A     | 4.0          |
| 65-69       | A-    | 3.7          |
| 60-64       | B+    | 3.3          |
| 55-59       | B     | 3.0          |
| 50-54       | B-    | 2.7          |
| 45-49       | C+    | 2.3          |
| 40-44       | C     | 2.0          |
| 35-39       | C-    | 1.7          |
| 30-34       | D+    | 1.3          |
| 25-29       | D     | 1.0          |
| 0-24        | F     | 0.0          |

### Continuation Policy

- **Good Standing**: CGPA ≥ 2.0
- **Academic Probation**: CGPA 1.5 - 1.99
- **Discontinuation**: CGPA < 1.5 for two consecutive semesters

---

## Authentication & Access Control

### Role-Based Access

The system implements role-based access control (RBAC) with three roles:

- **Student**: Access to registration, results viewing, and profile management
- **Instructor**: Access to results management and student tracking
- **Admin**: Full access to all system features including registration and results management

### Demo Credentials

For testing purposes, the following demo accounts are available:

| Role  | Email                  | Password   |
|-------|------------------------|------------|
| Student | student@example.com   | password123 |
| Instructor | instructor@example.com | password123 |
| Admin | admin@example.com     | admin123 |

**Admin Registration Code**: To create new admin accounts, use the code `ADMIN2026`

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new files
- Follow the existing component patterns
- Use Tailwind CSS for styling
- Write mobile-first responsive code
- Add proper TypeScript types

---

## License

This project is licensed under the MIT License.
#   L M S  
 #   l m s _ f r o n t  
 