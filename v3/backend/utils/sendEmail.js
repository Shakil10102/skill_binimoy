const nodemailer = require('nodemailer');

/**
 * Send email using configured provider:
 * 1. Gmail SMTP (via Nodemailer) - recommended & easiest
 * 2. Brevo HTTP API
 * 3. Custom SMTP (via Nodemailer)
 * 4. Fallback logger (prints code clearly in terminal so verification never blocks)
 */
const sendEmail = async (to, subject, text) => {
    const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
    const brevoApiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL || gmailUser || 'no-reply@skillbinimoy.com';

    // -------------------------------------------------------------
    // Provider 1: Gmail SMTP via Nodemailer
    // -------------------------------------------------------------
    if (gmailUser && gmailPass) {
        try {
            const cleanPass = gmailPass.replace(/\s+/g, '');
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: gmailUser,
                    pass: cleanPass
                }
            });

            const htmlContent = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background: #0F172A; color: #F8FAFC; border-radius: 16px; border: 1px solid #334155;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="width: 50px; height: 50px; margin: 0 auto 12px; border-radius: 14px; background: linear-gradient(135deg, #6C63FF, #00C2FF); display: inline-flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: white; line-height: 50px;">SB</div>
                        <h1 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 0; letter-spacing: -0.5px;">Skill Binimoy</h1>
                        <p style="font-size: 13px; color: #94A3B8; margin: 4px 0 0 0;">Learn. Teach. Exchange.</p>
                    </div>
                    <div style="background: #1E293B; border-radius: 14px; padding: 22px; text-align: center; margin-bottom: 22px; border: 1px solid #334155;">
                        <p style="font-size: 14px; color: #94A3B8; margin: 0 0 10px 0;">${subject}</p>
                        <p style="font-size: 18px; color: #FFFFFF; font-weight: 700; margin: 0; line-height: 1.5;">${text}</p>
                    </div>
                    <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0; line-height: 1.5;">
                        If you did not request this email from Skill Binimoy, you can safely ignore it.
                    </p>
                </div>
            `;

            const info = await transporter.sendMail({
                from: `"Skill Binimoy" <${gmailUser}>`,
                to,
                subject,
                text,
                html: htmlContent
            });

            console.log(`✅ [Email Sent via Gmail] To: ${to} (Message ID: ${info.messageId})`);
            return { success: true, provider: 'gmail', info };
        } catch (gmailErr) {
            console.error('❌ Gmail SMTP error:', gmailErr.message);
            // If Brevo is not configured, fall through to fallback
            if (!brevoApiKey) {
                logEmailFallback(to, subject, text, gmailErr.message);
                throw new Error('Gmail delivery failed: ' + gmailErr.message);
            }
        }
    }

    // -------------------------------------------------------------
    // Provider 2: Brevo API
    // -------------------------------------------------------------
    if (brevoApiKey && brevoApiKey !== 'your-brevo-api-key') {
        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'api-key': brevoApiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    sender: {
                        name: 'Skill Binimoy',
                        email: senderEmail
                    },
                    to: [{ email: to }],
                    subject: subject,
                    textContent: text
                })
            });

            const data = await response.json();
            if (!response.ok) {
                console.error('❌ Brevo error:', data);
                logEmailFallback(to, subject, text, data.message || 'Brevo API rejected');
                throw new Error(data.message || 'Failed to send email via Brevo');
            }

            console.log(`✅ [Email Sent via Brevo] To: ${to}`);
            return { success: true, provider: 'brevo', data };
        } catch (brevoErr) {
            console.error('❌ Brevo request error:', brevoErr.message);
            logEmailFallback(to, subject, text, brevoErr.message);
            throw brevoErr;
        }
    }

    // -------------------------------------------------------------
    // Provider 3: Custom SMTP
    // -------------------------------------------------------------
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: Number(process.env.SMTP_PORT) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            const info = await transporter.sendMail({
                from: `"Skill Binimoy" <${process.env.SMTP_USER}>`,
                to,
                subject,
                text
            });

            console.log(`✅ [Email Sent via SMTP] To: ${to}`);
            return { success: true, provider: 'smtp', info };
        } catch (smtpErr) {
            console.error('❌ Custom SMTP error:', smtpErr.message);
            logEmailFallback(to, subject, text, smtpErr.message);
            throw smtpErr;
        }
    }

    // -------------------------------------------------------------
    // Provider 4: Fallback Logger (No credentials provided)
    // -------------------------------------------------------------
    logEmailFallback(to, subject, text, 'No email service credentials found in .env');
    throw new Error('Email credentials not configured. Please set GMAIL_USER & GMAIL_PASS or BREVO_API_KEY in backend/.env');
};

function logEmailFallback(to, subject, text, reason) {
    console.log('\n' + '='.repeat(64));
    console.log('📬 [SKILL BINIMOY - EMAIL DISPATCH]');
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Content: ${text}`);
    if (reason) {
        console.log(`   Status:  ${reason}`);
    }
    console.log('-'.repeat(64));
    console.log('💡 How to receive real emails in your Gmail inbox:');
    console.log('   1. Open Google Account -> Security -> 2-Step Verification');
    console.log('   2. Create an "App Password" (16 characters)');
    console.log('   3. Add to v3/backend/.env:');
    console.log('      GMAIL_USER=your_email@gmail.com');
    console.log('      GMAIL_PASS=xxxx xxxx xxxx xxxx');
    console.log('='.repeat(64) + '\n');
}

module.exports = sendEmail;
