# Dental App Backend

Express.js backend API for the SRM Dental Web Application.

## Tech Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express.js 5.x
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **Email**: Nodemailer / SendGrid / Resend

## Features

- User authentication (Admin, Doctor, Patient roles)
- Patient management
- Appointment booking
- Case sheets (multiple departments)
- Prescription management
- Billing system
- Reports generation
- Email notifications (OTP)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Required
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this

# Required for production
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app

# Optional - Email configuration
EMAIL_PROVIDER=gmail
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### OTP
- `POST /api/otp/send` - Send OTP
- `POST /api/otp/verify` - Verify OTP

### Patient Details
- `GET /api/patient-details` - Get all patients
- `POST /api/patient-details` - Create patient
- `GET /api/patient-details/:id` - Get patient by ID
- `PUT /api/patient-details/:id` - Update patient
- `DELETE /api/patient-details/:id` - Delete patient

### Appointments
- `POST /api/appointment/book` - Book appointment
- `GET /api/appointment/patient/:patientId` - Get patient appointments

### Prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions/patient/:patientId` - Get patient prescriptions

### Case Sheets
- `POST /api/pedodontics` - Pedodontics case
- `POST /api/complete-denture` - Complete denture case
- `POST /api/fpd` - FPD case
- `POST /api/implant` - Implant case
- `POST /api/partial` - Partial denture case
- `POST /api/general` - General case

### Billing
- `POST /api/billing` - Create bill
- `GET /api/billing/patient/:patientId` - Get patient bills

### Reports
- `GET /api/reports/weekly` - Weekly report
- `GET /api/reports/monthly` - Monthly report

## Deployment (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Vercel Configuration

The `vercel.json` file is already configured for serverless deployment.

### MongoDB Atlas Setup

1. Create cluster on MongoDB Atlas
2. Add Vercel IPs to Network Access (or use 0.0.0.0/0)
3. Create database user
4. Get connection string
5. Add to Vercel environment variables as `MONGO_URI`

## Project Structure

```
backend/
├── config/          # Database configuration
├── middleware/      # Auth & role middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── .env.example     # Environment template
├── .gitignore       # Git ignore rules
├── package.json     # Dependencies
├── Server.js        # Main server file
├── vercel.json      # Vercel configuration
└── README.md        # This file
```

## Security Notes

- Never commit `.env` file
- Use strong JWT_SECRET in production
- Enable MongoDB Atlas IP whitelist
- Use HTTPS in production
- Validate all user inputs
- Implement rate limiting for production

## Support

For issues or questions, contact the development team.

## License

Private - SRM Dental College
