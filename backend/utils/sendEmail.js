import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, html) => {
  const recipient = (to || '').toString().trim();
  const emailUser = (process.env.EMAIL_USER || 'dnimbalkar340@gmail.com').trim();
  const rawEmailPass = (process.env.EMAIL_PASS || 'qscb aion kkpu ijbl').trim();
  const emailPass = rawEmailPass.replace(/\s+/g, '');

  // 1. Check for Resend HTTPS REST API (Port 443 - never blocked on Render)
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '') {
    try {
      console.log(`[Email] Sending via Resend HTTPS API to ${recipient}...`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Smart Civic Reporter <onboarding@resend.dev>',
          to: [recipient],
          subject,
          html,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Email sent via Resend to ${recipient}: ${data.id}`);
        return { messageId: data.id, provider: 'resend' };
      }
      const errText = await res.text();
      console.warn(`[Email] Resend API returned ${res.status}: ${errText}`);
    } catch (resendErr) {
      console.warn(`[Email] Resend API failed: ${resendErr.message}`);
    }
  }

  // 2. Check for Brevo HTTPS REST API (Port 443 - never blocked on Render)
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim() !== '') {
    try {
      console.log(`[Email] Sending via Brevo HTTPS API to ${recipient}...`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY.trim(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Smart Civic Reporter', email: emailUser },
          to: [{ email: recipient }],
          subject,
          htmlContent: html,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Email sent via Brevo to ${recipient}: ${data.messageId}`);
        return { messageId: data.messageId, provider: 'brevo' };
      }
      const errText = await res.text();
      console.warn(`[Email] Brevo API returned ${res.status}: ${errText}`);
    } catch (brevoErr) {
      console.warn(`[Email] Brevo API failed: ${brevoErr.message}`);
    }
  }

  // 3. Check for Generic HTTPS Webhook / Google Script Relay
  if (process.env.EMAIL_WEBHOOK_URL && process.env.EMAIL_WEBHOOK_URL.trim() !== '') {
    try {
      console.log(`[Email] Sending via HTTPS Webhook Relay to ${recipient}...`);
      const res = await fetch(process.env.EMAIL_WEBHOOK_URL.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipient, subject, html }),
      });
      if (res.ok) {
        console.log(`✅ Email sent via Webhook Relay to ${recipient}`);
        return { messageId: 'webhook-' + Date.now(), provider: 'webhook' };
      }
    } catch (webhookErr) {
      console.warn(`[Email] Webhook Relay failed: ${webhookErr.message}`);
    }
  }

  // 4. Fallback to Direct Nodemailer SMTP with fast 3500ms timeout
  const createTransporter = (port, secure) => nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port,
    secure,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 3500,
    greetingTimeout: 3500,
    socketTimeout: 3500,
    tls: {
      rejectUnauthorized: false
    },
  });

  const mailOptions = {
    from: `"Smart Civic Reporter" <${emailUser}>`,
    to: recipient,
    subject,
    html,
  };

  try {
    const transporter = createTransporter(587, false);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${recipient} via port 587: ${info.messageId}`);
    return info;
  } catch (primaryError) {
    console.warn(`⚠️ Port 587 send failed (${primaryError.message}), attempting Port 465 SSL fallback...`);
    try {
      const fallbackTransporter = createTransporter(465, true);
      const info = await fallbackTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${recipient} via port 465: ${info.messageId}`);
      return info;
    } catch (fallbackError) {
      console.error(`❌ SMTP direct connection failed on both ports (${fallbackError.message}). Note: Render Free Tier blocks outbound SMTP ports 25, 465, and 587.`);
      throw new Error(`Email delivery timed out. Note: Render free tier blocks outbound SMTP ports (25, 465, 587).`);
    }
  }
};

export default sendEmail;
