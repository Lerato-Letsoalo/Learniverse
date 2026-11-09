import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function testEmail() {
    try {
        await transporter.verify();
        console.log('Gmail SMTP connection successful!');

        const result = await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: process.env.SMTP_USER,
            subject: 'Learniverse - Email Test',
            text: 'Your Learniverse password-reset email service is working!'
        });

        console.log('Test email sent:', result.messageId);

    } catch (error) {
        console.error('Email test failed:', error.message);
    }
}

testEmail();