import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, html) => {
  // Resolve email credentials with fallback to verified project credentials
  const emailUser = (process.env.EMAIL_USER || 'dnimbalkar340@gmail.com').trim();
  const rawEmailPass = (process.env.EMAIL_PASS || 'qscb aion kkpu ijbl').trim();
  // Strip any accidental spaces from Gmail App Password
  const emailPass = rawEmailPass.replace(/\s+/g, '');

  if (!emailUser || !emailPass) {
    console.error('❌ EMAIL_USER or EMAIL_PASS environment variables are not set and no fallback available!');
    throw new Error('Email service not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
  }

  const createTransporter = (options = {}) => nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: options.port || 587,
    secure: options.secure !== undefined ? options.secure : false,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
    tls: {
      rejectUnauthorized: false
    },
    ...options
  });

  const mailOptions = {
    from: `"Smart Civic Reporter" <${emailUser}>`,
    to: (to || '').toString().trim(),
    subject,
    html,
  };

  try {
    // Primary attempt: Port 587 STARTTLS (standard for cloud platforms like Render)
    const transporter = createTransporter({ port: 587, secure: false });
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${mailOptions.to}: ${info.messageId}`);
    return info;
  } catch (primaryError) {
    console.warn(`⚠️ Port 587 send failed (${primaryError.message}), attempting Port 465 SSL fallback...`);
    try {
      // Fallback attempt: Port 465 SSL
      const fallbackTransporter = createTransporter({ port: 465, secure: true });
      const info = await fallbackTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${mailOptions.to} via fallback port 465: ${info.messageId}`);
      return info;
    } catch (fallbackError) {
      console.error(`❌ Email send failed to ${mailOptions.to}:`, fallbackError.message);
      if (fallbackError.message.includes('Invalid login') || fallbackError.message.includes('Username and Password')) {
        throw new Error('Gmail authentication failed. Make sure EMAIL_PASS is a valid Gmail App Password.');
      }
      throw fallbackError;
    }
  }
};

export default sendEmail;
