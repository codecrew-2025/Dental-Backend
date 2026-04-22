// server/Server.js - Backend-only version for separate deployment
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/Auth.js';
import otpRoutes from './routes/send-otp.js';
import appointmentRoutes from './routes/appointment.js';
import doctorPatientRoutes from './routes/doctor-patient-route.js';
import pedodonticsRoutes from './routes/caseSheetRoutes.js';
import completeDentureRoutes from './routes/complete-denture.js';
import casesheetRoutes from './routes/casesheets.js';
import FpdRoutes from './routes/fpd-route.js';
import implantRoutes from './routes/Implant-route.js';  
import implantPatientRoute from './routes/ImplantPatient-route.js';
import partialRoute from './routes/partial-route.js';
import generalCaseRoutes from './routes/general-case.js';
import consentFormRoutes from './routes/consent-form.js';
import caseDraftRoutes from './routes/case-draft.js';
import prescriptionRoutes from './routes/prescription.js';
import patientDetailsRoutes from './routes/patient-details-route.js';
import reportsRoutes from './routes/reports.js';
import billingRoutes from './routes/bill-route.js';

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

let dbInitError = null;

const ensureDatabaseConnection = async () => {
  if (!process.env.MONGO_URI) {
    return { ok: false, error: new Error('Missing MONGO_URI environment variable') };
  }

  if (mongoose.connection.readyState === 1) {
    return { ok: true, error: null };
  }

  try {
    await connectDB();
    dbInitError = null;
    return { ok: mongoose.connection.readyState === 1, error: null };
  } catch (error) {
    dbInitError = error;
    return { ok: false, error };
  }
};

if (!process.env.MONGO_URI) {
  console.error('❌ Missing required env var: MONGO_URI');
  console.error('   Set MONGO_URI in deployment environment variables.');
  if (!isVercel) process.exit(1);
}

if (isProduction && !process.env.JWT_SECRET) {
  console.error('❌ Missing required env var in production: JWT_SECRET');
  console.error('   Set JWT_SECRET in deployment environment variables.');
  if (!isVercel) process.exit(1);
}

// Connect to MongoDB
connectDB().catch((error) => {
  dbInitError = error;
  console.error('❌ MongoDB initialization failed:', error?.message || error);
});

// CORS Configuration
const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: !isProduction ? true : corsOrigins.length > 0 ? corsOrigins : false,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Database connection middleware for API routes
app.use('/api', async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  const isDebugRoute = req.path === '/debug/routes';
  const isHealthRoute = req.path === '/health';
  const isOtpDiagnosticRoute = req.path === '/otp/email-status' || req.path === '/otp/test-email';
  if (isHealthRoute || isOtpDiagnosticRoute || isDebugRoute) return next();

  if (!process.env.MONGO_URI) {
    const publicMessage = isProduction
      ? 'Service temporarily unavailable. Please try again shortly.'
      : 'Database not configured: missing MONGO_URI environment variable.';
    return res.status(503).json({
      success: false,
      message: publicMessage,
      hint: isProduction ? null : 'Set MONGO_URI in Vercel Project Settings → Environment Variables and redeploy.',
      timestamp: new Date().toISOString(),
    });
  }

  if (dbInitError || mongoose.connection.readyState !== 1) {
    const reconnectAttempt = await ensureDatabaseConnection();

    if (reconnectAttempt.ok && mongoose.connection.readyState === 1) {
      return next();
    }

    const lastError = reconnectAttempt.error || dbInitError;
    const rawErrorMessage = String(lastError?.message || '').trim();
    const whitelistHint = /whitelist|not\s+whitelisted|access\s+list|atlas/i.test(rawErrorMessage)
      ? 'MongoDB Atlas rejected this IP. Add your current IP to Atlas Network Access and retry.'
      : null;

    const publicMessage = isProduction
      ? 'Service temporarily unavailable. Please try again shortly.'
      : 'Database not connected. Check MONGO_URI and MongoDB network access.';

    return res.status(503).json({
      success: false,
      message: publicMessage,
      error: !isProduction ? (rawErrorMessage || null) : null,
      hint: !isProduction ? whitelistHint : null,
      timestamp: new Date().toISOString(),
    });
  }

  return next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development only)
if (!isProduction) {
  app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
  });
}

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Dental App Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      auth: '/api/auth/*',
      patients: '/api/patient-details',
      appointments: '/api/appointment/*',
      prescriptions: '/api/prescriptions/*',
      billing: '/api/billing/*',
      reports: '/api/reports/*',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStateLabel = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : dbState === 3 ? 'disconnecting' : 'disconnected';

  const payload = {
    success: true,
    message: 'Health check',
    environment: process.env.NODE_ENV || 'development',
    isVercel,
    checks: {
      mongoUriPresent: Boolean(process.env.MONGO_URI),
      jwtSecretPresent: Boolean(process.env.JWT_SECRET),
      dbState,
      dbStateLabel,
      dbInitError: dbInitError ? String(dbInitError.message || dbInitError) : null,
    },
    timestamp: new Date().toISOString(),
  };

  if (isProduction && (!payload.checks.mongoUriPresent || payload.checks.dbState === 0 || payload.checks.dbInitError)) {
    return res.status(503).json(payload);
  }

  return res.json(payload);
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Register API routes
console.log('Registering routes...');

app.use('/api/auth', authRoutes);
console.log('✓ Auth routes registered');

app.use('/api/otp', otpRoutes);
console.log('✓ OTP routes registered');

app.use('/api/appointment', appointmentRoutes);
console.log('✓ Appointment routes registered');

app.use('/api/doctor-patient', doctorPatientRoutes);
console.log('✓ Doctor-patient routes registered');

app.use('/api/pedodontics', pedodonticsRoutes);
console.log('✓ Pedodontics routes registered');

app.use('/api/complete-denture', completeDentureRoutes);
console.log('✓ Complete Denture routes registered');

app.use('/api/casesheets', casesheetRoutes);
console.log('✓ Casesheets routes registered');

app.use('/api/fpd', FpdRoutes);
console.log('✓ FPD routes registered');

app.use('/api/implant', implantRoutes);
console.log('✓ Implant routes registered');

app.use('/api/ImplantPatient', implantPatientRoute);
console.log('✓ ImplantPatient routes registered');

app.use('/api/partial', partialRoute);
console.log('✓ Partial routes registered');

app.use('/api/general', generalCaseRoutes);
console.log('✓ General routes registered');

app.use('/api/case-drafts', caseDraftRoutes);
console.log('✓ Case drafts routes registered');

app.use('/api/prescriptions', prescriptionRoutes);
console.log('✓ Prescription routes registered');

app.use('/api/patient-details', patientDetailsRoutes);
console.log('✓ Patient details routes registered');

app.use('/api/reports', reportsRoutes);
console.log('✓ Reports routes registered');

app.use('/api/billing', billingRoutes);
console.log('✓ Billing routes registered');

app.use('/api/consent-forms', consentFormRoutes);
console.log('✓ Consent forms routes registered');

// Debug routes endpoint
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  const activeRouter = app?._router || app?.router;
  const stack = Array.isArray(activeRouter?.stack) ? activeRouter.stack : [];

  stack.forEach((layer) => {
    if (layer?.route) {
      routes.push({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods || {}),
      });
      return;
    }

    const nestedStack = layer?.handle?.stack;
    if (layer?.name === 'router' && Array.isArray(nestedStack)) {
      nestedStack.forEach((nestedLayer) => {
        if (nestedLayer?.route) {
          routes.push({
            path: nestedLayer.route.path,
            methods: Object.keys(nestedLayer.route.methods || {}),
          });
        }
      });
    }
  });

  res.json({
    success: true,
    message: 'Available routes',
    routes: routes,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler caught error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - MUST be last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    hint: 'Check /api/debug/routes for available endpoints',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;
if (!isVercel) {
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log(`🚀 Backend API running at http://localhost:${PORT}`);
    console.log('='.repeat(60));
    console.log('Available endpoints:');
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Test: http://localhost:${PORT}/api/test`);
    console.log(`   Routes: http://localhost:${PORT}/api/debug/routes`);
    console.log('='.repeat(60) + '\n');
  });
}

export default app;
