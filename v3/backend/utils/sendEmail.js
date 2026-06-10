const sendEmail = async (to, subject, text) => {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'Skill Binimoy <onboarding@resend.dev>',
            to: [to],
            subject: subject,
            text: text
        })
    });
 
    const data = await response.json();
    if (!response.ok) {
        console.error('Resend error:', data);
        throw new Error(data.message || 'Failed to send email');
    }
    return data;
};
 
module.exports = sendEmail;
