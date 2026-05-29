# Laravel Backend Integration Guide

This guide explains how to connect your Next.js frontend to the Laravel backend.

## Quick Start

### 1. Start the Laravel Backend

```bash
cd C:\Users\AL MUZANY\Documents\Dev\college-backend

# First time setup (run setup.bat or manually):
setup.bat

# Or manually:
composer install
copy .env.example .env
php artisan key:generate
# Edit .env with your database credentials
php artisan migrate
php artisan db:seed

# Start the server
php artisan serve
```

The Laravel API will be available at `http://localhost:8000`

### 2. Configure Frontend Environment

```bash
cd C:\Users\AL MUZANY\Documents\Dev\LMS

# Copy the example environment file
copy .env.local.example .env.local

# Edit .env.local and ensure:
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. Start the Frontend

```bash
npm run dev
```

## API Client Usage

The API client is located at `lib/api-client.ts`. Here's how to use it:

### Authentication

```typescript
import { apiClient } from '@/lib/api-client';

// Login
const { user, token } = await apiClient.login('student@college.edu', 'password123');

// Register
const { user, token } = await apiClient.register({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  phone: '0712345678',
});

// Get current user
const user = await apiClient.getCurrentUser();

// Logout
await apiClient.logout();
```

### Registrations

```typescript
// Create registration
const registration = await apiClient.createRegistration({
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: '2000-01-15',
  gender: 'male',
  national_id: '12345678',
  national_id_type: 'national_id',
  phone: '0712345678',
  email: 'john@example.com',
  address: '123 Main St',
  city: 'Nairobi',
  country: 'Kenya',
  academic_qualifications: [
    {
      level: 'o_level',
      institution_name: 'Nairobi High School',
      institution_address: 'Nairobi',
      country: 'Kenya',
      start_date: '2015-01-01',
      end_date: '2018-12-31',
      grade: 'A',
    }
  ],
  program_id: 1,
  intake: 'September 2024',
  study_mode: 'full_time',
  guardian_name: 'Jane Doe',
  guardian_phone: '0787654321',
  guardian_email: 'jane@example.com',
  guardian_relationship: 'Mother',
  guardian_address: '123 Main St',
});

// Get registrations
const registrations = await apiClient.getRegistrations();

// Get specific registration
const registration = await apiClient.getRegistration(1);
```

### Payments

```typescript
// Process payment
const payment = await apiClient.processPayment({
  registration_id: 1,
  fee_type: 'registration_fee',
  method: 'mpesa',
  phone_number: '0712345678',
});

// Get payments for a registration
const payments = await apiClient.getRegistrationPayments(1);

// Get all payments
const allPayments = await apiClient.getPayments();
```

### Exam Results

```typescript
// Get student results (for current student)
const { results, summary } = await apiClient.getStudentResults();

// Get results for specific student (admin/instructor only)
const { results, summary } = await apiClient.getStudentResults(5);

// Create exam result (instructor/admin only)
const result = await apiClient.createExamResult({
  student_id: 5,
  course_offering_id: 1,
  cat1_score: 15,
  cat2_score: 18,
  assignment_score: 12,
  final_exam_score: 55,
});
```

### Programs & Departments

```typescript
// Get all programs
const programs = await apiClient.getPrograms();

// Get programs by department
const programs = await apiClient.getPrograms(1);

// Get departments
const departments = await apiClient.getDepartments();
```

## Data Mapping: Frontend Types to Laravel API

### National ID Types

| Frontend Value | Laravel Value |
|----------------|---------------|
| `passport` | `passport` |
| `national_id` | `national_id` |
| `birth_certificate` | `birth_certificate` |

### Academic Qualification Levels

| Frontend Value | Laravel Value |
|----------------|---------------|
| `o_level` | `o_level` |
| `a_level` | `a_level` |
| `certificate` | `certificate` |
| `diploma` | `diploma` |
| `degree` | `degree` |
| `other` | `other` |

### Fee Types

| Frontend Value | Amount (TSH) |
|----------------|--------------|
| `registration_fee` | 5,000 |
| `tuition_fee` | 150,000 |
| `library_fee` | 2,000 |
| `laboratory_fee` | 3,000 |
| `examination_fee` | 1,500 |
| `hostel_fee` | 10,000 |
| `other` | 1,000 |

### Payment Methods

| Frontend Value | Laravel Value |
|----------------|---------------|
| `mpesa` | `mpesa` |
| `card` | `card` |
| `bank_transfer` | `bank_transfer` |
| `cash` | `cash` |

### Study Modes

| Frontend Value | Laravel Value |
|----------------|---------------|
| `full_time` | `full_time` |
| `part_time` | `part_time` |
| `distance_learning` | `distance_learning` |

## Authentication Flow

1. User logs in via `/api/login`
2. Laravel returns a Bearer token
3. Frontend stores token in `localStorage`
4. Token is sent with every request in the `Authorization` header
5. Laravel Sanctum validates the token

## Error Handling

The API client throws errors for non-2xx responses:

```typescript
try {
  const data = await apiClient.login(email, password);
} catch (error) {
  if (error.message) {
    // Display error message to user
    console.error(error.message);
  }
}
```

## CORS Configuration

The Laravel backend is configured to accept requests from:
- `http://localhost:3000`
- `https://localhost:3000`

If your frontend runs on a different port, update `config/cors.php` in the Laravel project.

## Default Test Credentials

After running `php artisan db:seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@college.edu` | `password123` |
| Instructor | `instructor@college.edu` | `password123` |
| Student | `student@college.edu` | `password123` |

## API Endpoints Reference

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user
- `PUT /api/user` - Update profile

### Programs & Departments
- `GET /api/programs` - List programs
- `GET /api/programs/{id}` - Get program details
- `GET /api/departments` - List departments

### Registrations
- `GET /api/registrations` - List registrations
- `POST /api/registrations` - Create registration
- `GET /api/registrations/{id}` - Get registration
- `POST /api/registrations/{id}/approve` - Approve (admin)
- `POST /api/registrations/{id}/reject` - Reject (admin)

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Process payment
- `GET /api/payments/{id}` - Get payment
- `POST /api/payments/{id}/verify-cash` - Verify cash (admin)
- `GET /api/registrations/{id}/payments` - Get registration payments

### Exam Results
- `GET /api/exam-results` - List results
- `POST /api/exam-results` - Create result (instructor/admin)
- `GET /api/exam-results/{id}` - Get result
- `PUT /api/exam-results/{id}` - Update result
- `POST /api/exam-results/{id}/publish` - Publish result
- `GET /api/student-results` - Get current student results
- `GET /api/students/{id}/results` - Get student results
- `GET /api/course-offerings/{id}/results` - Get course results

## Troubleshooting

### Connection Refused
- Ensure Laravel server is running: `php artisan serve`
- Check the port in `.env.local` matches the Laravel server port

### CORS Errors
- Verify `FRONTEND_URL` in Laravel `.env` matches your Next.js URL
- Clear Laravel config cache: `php artisan config:clear`

### Authentication Errors
- Check that token is being stored in `localStorage`
- Verify the `Authorization` header is being sent with requests

## Next Steps

1. Update your React components to use the API client
2. Replace mock data with real API calls
3. Add loading states and error handling
4. Implement role-based UI (hide/show admin features)

## Support

For Laravel backend issues, check the backend README at:
`C:\Users\AL MUZANY\Documents\Dev\college-backend\README.md`

