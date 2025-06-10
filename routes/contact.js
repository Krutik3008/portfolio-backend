import express from 'express';
import Contact from '../models/Contact.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Validate request body
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Save to MongoDB
        const newContact = new Contact({ name, email, subject, message });
        await newContact.save();
        console.log('Data saved to MongoDB:', { name, email, subject, message });

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'patelkrupal3011@gmail.com',
            subject: `New Contact Form Submission: ${subject}`,
            text: `
                You have a new contact form submission:

                Name: ${name}
                Email: ${email}
                Subject: ${subject}
                Message: ${message}
            `,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong> ${message}</p>
            `,
        };

        await req.transporter.sendMail(mailOptions);
        console.log('Email sent to patelkrupal3011@gmail.com');

        res.status(201).json({ message: 'Message saved and email sent successfully' });
    } catch (error) {
        console.error('Error in contact route:', error);

        // Provide more specific error messages
        if (error.name === 'MongoError') {
            res.status(500).json({ message: 'Failed to save message to database', error: error.message });
        } else if (error.code === 'EAUTH') {
            res.status(500).json({ message: 'Failed to send email due to authentication error', error: error.message });
        } else {
            res.status(500).json({ message: 'Failed to process request', error: error.message });
        }
    }
});

export default router;