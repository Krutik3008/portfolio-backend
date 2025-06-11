import express from 'express';
import Contact from '../models/Contact.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Validate request body
    if (!name || !email || !subject || !message) {
        console.error('Validation error: All fields are required', { name, email, subject, message });
        return res.status(400).json({ message: 'All fields are required' });
    }

    let savedContact;
    try {
        // Save to MongoDB
        const newContact = new Contact({ name, email, subject, message });
        savedContact = await newContact.save();
        console.log('Data saved to MongoDB:', { id: savedContact._id, name, email, subject, message });
    } catch (error) {
        console.error('MongoDB save error:', error);
        return res.status(500).json({ message: 'Failed to save message to database', error: error.message });
    }

    try {
        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Use EMAIL_USER to ensure the sender and receiver align
            replyTo: email, // Allows replying directly to the sender
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

        console.log('Sending email with options:', { ...mailOptions, auth: '[REDACTED]' });

        await req.transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', process.env.EMAIL_USER);

        res.status(201).json({ message: 'Message saved and email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        // If email fails but MongoDB save succeeded, still return a partial success
        res.status(201).json({ 
            message: 'Message saved to database, but failed to send email', 
            error: error.message,
            savedData: { id: savedContact._id, name, email, subject, message }
        });
    }
});

export default router;