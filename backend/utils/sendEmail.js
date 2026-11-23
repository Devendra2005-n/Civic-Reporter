import nodemailer from 'nodemailer';
import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const sendEmail = async (to, subject, html, extra = {}) => {
  const recipient = (to || '').toString().trim();
  const emailUser = (process.env.EMAIL_USER || 'dnimbalkar340@gmail.com').trim();
  const rawEmailPass = (process.env.EMAIL_PASS || 'qscb aion kkpu ijbl').trim();
  const emailPass = rawEmailPass.replace(/\s+/g, '');

  // 1. Check for EmailJS REST API (Port 443 - 100% Free HTTPS, never blocked on Render)
  const emailjsServiceId = (process.env.EMAILJS_SERVICE_ID || process.env.SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID || '').trim();
  const emailjsTemplateId = (process.env.EMAILJS_TEMPLATE_ID || process.env.TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID || '').trim();
  const emailjsPublicKey = (process.env.EMAILJS_PUBLIC_KEY || process.env.PUBLIC_KEY || process.env.EMAILJS_USER_ID || process.env.USER_ID || process.env.VITE_EMAILJS_PUBLIC_KEY || '').trim();
  const emailjsPrivateKey = (process.env.EMAILJS_PRIVATE_KEY || process.env.PRIVATE_KEY || process.env.EMAILJS_ACCESS_TOKEN || process.env.ACCESS_TOKEN || '').trim();

  if (emailjsServiceId && emailjsTemplateId) {
    try {
      console.log(`[Email] Sending via EmailJS REST API to ${recipient}... (service: ${emailjsServiceId}, template: ${emailjsTemplateId})`);
      const payload = {
        service_id: emailjsServiceId,
        template_id: emailjsTemplateId,
        user_id: emailjsPublicKey,
        template_params: {
          to_email: recipient,
          email: recipient,
          user_email: recipient,
          recipient: recipient,
          to: recipient,
          to_name: extra?.name || 'Citizen',
          name: extra?.name || 'Citizen',
          user_name: extra?.name || 'Citizen',
          otp: extra?.otp || '',
          passcode: extra?.otp || '',
          code: extra?.otp || '',
          verification_code: extra?.otp || '',
          subject,
          message: extra?.otp ? `Your verification code is: ${extra.otp}. It expires in 10 minutes.` : html,
          html_content: html,
          reply_to: emailUser,
        },
      };

      if (emailjsPrivateKey) {
        payload.accessToken = emailjsPrivateKey;
      }

      const res = await axios.post(
        'https://api.emailjs.com/api/v1.0/email/send',
        payload,
        {
          httpsAgent,
          headers: {
            'Content-Type': 'application/json',
            'origin': 'http://localhost',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          timeout: 10000,
        }
      );

      if (res.status === 200 || res.status === 201 || res.data === 'OK') {
        console.log(`✅ Email sent via EmailJS to ${recipient}`);
        return { messageId: 'emailjs-' + Date.now(), provider: 'emailjs' };
      }
    } catch (emailjsErr) {
      const status = emailjsErr.response?.status;
      const data = emailjsErr.response?.data;
      const errMsg = typeof data === 'string' ? data : (data ? JSON.stringify(data) : emailjsErr.message);
      console.error(`❌ [Email] EmailJS API error (${status || 'network'}):`, errMsg);
      // Fail fast so the user sees the exact EmailJS diagnostic error instead of hanging on SMTP
      throw new Error(`EmailJS (${status || 'error'}): ${errMsg}`);
    }
  }

  // 2. Check for Brevo HTTPS REST API (Port 443 - never blocked on Render)
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim() !== '') {
    try {
      console.log(`[Email] Sending via Brevo HTTPS API to ${recipient}...`);
      const res = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: 'Smart Civic Reporter', email: emailUser },
          to: [{ email: recipient }],
          subject,
          htmlContent: html,
        },
        {
          httpsAgent,
          headers: {
            'api-key': process.env.BREVO_API_KEY.trim(),
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );
      if (res.data?.messageId) {
        console.log(`✅ Email sent via Brevo to ${recipient}: ${res.data.messageId}`);
        return { messageId: res.data.messageId, provider: 'brevo' };
      }
    } catch (brevoErr) {
      console.warn(`[Email] Brevo API error (${brevoErr.response?.status || brevoErr.message}):`, brevoErr.response?.data || brevoErr.message);
    }
  }

  // 3. Check for Generic HTTPS Webhook / Google Apps Script Relay (Port 443 - never blocked on Render)
  if (process.env.EMAIL_WEBHOOK_URL && process.env.EMAIL_WEBHOOK_URL.trim() !== '') {
    try {
      console.log(`[Email] Sending via HTTPS Webhook Relay to ${recipient}...`);
      const res = await axios.post(
        process.env.EMAIL_WEBHOOK_URL.trim(),
        { to: recipient, subject, html },
        {
          httpsAgent,
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
          maxRedirects: 5,
        }
      );
      console.log(`✅ Email sent via Webhook Relay to ${recipient}`);
      return { messageId: 'webhook-' + Date.now(), provider: 'webhook' };
    } catch (webhookErr) {
      console.warn(`[Email] Webhook Relay failed: ${webhookErr.message}`);
    }
  }

  // 4. Check for Resend HTTPS REST API (Port 443)
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '') {
    try {
      console.log(`[Email] Sending via Resend HTTPS API to ${recipient}...`);
      const res = await axios.post(
        'https://api.resend.com/emails',
        {
          from: process.env.RESEND_FROM || 'Smart Civic Reporter <onboarding@resend.dev>',
          to: [recipient],
          subject,
          html,
        },
        {
          httpsAgent,
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      if (res.data?.id) {
        console.log(`✅ Email sent via Resend to ${recipient}: ${res.data.id}`);
        return { messageId: res.data.id, provider: 'resend' };
      }
    } catch (resendErr) {
      console.warn(`[Email] Resend API error (${resendErr.response?.status || resendErr.message}):`, resendErr.response?.data || resendErr.message);
    }
  }

  // 4. Nodemailer SMTP (Port 465 SSL preferred first, then Port 587)
  const createTransporter = (config) => nodemailer.createTransport({
    ...config,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `"Smart Civic Reporter" <${emailUser}>`,
    to: recipient,
    subject,
    html,
  };

  // Attempt Port 465 direct SSL first
  try {
    const transporter465 = createTransporter({
      service: 'gmail',
      secure: true,
    });
    const info = await transporter465.sendMail(mailOptions);
    console.log(`✅ Email sent to ${recipient} via Gmail SSL: ${info.messageId}`);
    return info;
  } catch (sslError) {
    console.warn(`⚠️ Gmail SSL send failed (${sslError.message}), trying Port 587 fallback...`);
    try {
      const transporter587 = createTransporter({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
      });
      const info = await transporter587.sendMail(mailOptions);
      console.log(`✅ Email sent to ${recipient} via port 587: ${info.messageId}`);
      return info;
    } catch (fallbackError) {
      console.error(`❌ SMTP delivery failed on all ports (${fallbackError.message}).`);
      throw new Error(`Email delivery failed: ${fallbackError.message}. Note: Render Free Tier blocks outbound SMTP (ports 25, 465, 587). Use BREVO_API_KEY or EMAIL_WEBHOOK_URL for HTTPS delivery.`);
    }
  }
};

export default sendEmail;
