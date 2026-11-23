import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, html) => {
  // Validate env vars exist before attempting
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_USER or EMAIL_PASS environment variables are not set!');
    throw new Error('Email service not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,  // Must be Gmail App Password (not your Gmail login password)
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"Smart Civic Reporter" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Email send failed to ${to}:`, error.message);
    // Provide helpful error for common Gmail issues
    if (error.message.includes('Invalid login') || error.message.includes('Username and Password')) {
      throw new Error('Gmail authentication failed. Make sure EMAIL_PASS is a Gmail App Password (not your regular Gmail password). Generate one at: myaccount.google.com/apppasswords');
    }
    throw error;
  }
};

export default sendEmail;
