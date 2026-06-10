const nodemailer = require('nodemailer');

/**
 * Sends an email using Gmail SMTP via nodemailer.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 */
const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"Skill Binimoy" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        text: text,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
