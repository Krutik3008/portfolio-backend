import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import contactRoutes from './routes/contact.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Debug: Log all environment variables to confirm loading
console.log('Environment Variables:', {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS ? '[REDACTED]' : undefined,
});

if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI is not defined in .env file');
    throw new Error('MONGO_URI is not defined');
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Error: EMAIL_USER and EMAIL_PASS must be defined in .env file');
    throw new Error('EMAIL_USER and EMAIL_PASS are not defined');
}

// Set up Nodemailer transporter with Gmail SMTP settings
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// Verify email transporter
transporter.verify((error, success) => {
    if (error) {
        console.error('Email Transporter Error:', error);
        throw new Error('Email Transporter verification failed');
    } else {
        console.log('Email Transporter Ready');
    }
});

const app = express();

// Configure CORS for Vercel deployment
app.use(cors({
    origin: 'https://Krutik3008.github.io/portfolio-frontend', // Adjusted to match your frontend repo
    methods: ['GET', 'POST'],
    credentials: true,
}));

app.use(express.json());

// Pass transporter to routes
app.use('/api/contact', (req, res, next) => {
    req.transporter = transporter;
    try {
        console.log('Processing /api/contact request');
        next();
    } catch (error) {
        console.error('Error in /api/contact middleware:', error);
        res.status(500).json({ message: 'Server error in contact route' });
    }
}, contactRoutes);

// Test Route
app.get('/', (req, res) => {
    try {
        res.send('Backend is running');
    } catch (error) {
        console.error('Error in / route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Connect to MongoDB with retry logic
const connectToMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw new Error('MongoDB connection failed');
    }
};

// Initialize MongoDB connection
connectToMongoDB();

// Export for Vercel
export default app;