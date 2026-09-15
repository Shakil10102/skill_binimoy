const sendEmail = async (to, subject, text) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: 'Skill Binimoy',
                email: process.env.SENDER_EMAIL  // must be the verified sender email in Brevo
            },
            to: [{ email: to }],
            subject: subject,
            textContent: text
        })
    });

    const data = await response.json();
    if (!response.ok) {
        console.error('Brevo error:', data);
        throw new Error(data.message || 'Failed to send email');
    }
    return data;
};

module.exports = sendEmail;
