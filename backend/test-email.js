import 'dotenv/config';
import nodemailer from 'nodemailer';

async function test() {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log("Testing email with user:", process.env.EMAIL_USER);
    // Don't log full password for security, just length to verify it's loaded
    console.log("Password length:", process.env.EMAIL_PASS?.length);

    await transporter.verify();
    console.log("Transporter verified successfully. Ready to send emails.");
  } catch (error) {
    console.error("Failed to verify nodemailer:", error);
  }
}

test();
