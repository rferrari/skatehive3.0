'use server'
import nodemailer from 'nodemailer';
import { htmlToText } from 'html-to-text';
import getMailTemplate_Invite from './template';
import { APP_CONFIG, EMAIL_DEFAULTS } from '@/config/app.config';

export default async function serverMailer(
  to: string,
  subject: string,
  createdby: string,
  desiredUsername: string,
  masterPassword: string,
  keys: any,
  language: string // Add language parameter
) {

  // Create transporter object using nodemailer
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || EMAIL_DEFAULTS.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || EMAIL_DEFAULTS.SMTP_PORT,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : EMAIL_DEFAULTS.SMTP_SECURE,   // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Try sending the email
  try {
    // Get HTML template and Convert HTML to plain text
    const html = getMailTemplate_Invite(createdby, desiredUsername, masterPassword, keys, language); // Pass language
    const text = htmlToText(html, {
      preserveNewlines: true, // Optional: Preserve newlines
      //wordwrap: 130,   // Optional: Set a word wrap length (e.g., 130 characters)
    });

    // Define the attachment object
    const attachment = {
      name: "KEYS-BACKUP" + desiredUsername + "-SKATEHIVE.TXT",
      data: text,
      type: "text/plain"
    };

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER || EMAIL_DEFAULTS.FROM_ADDRESS,
      bcc: process.env.EMAIL_RECOVERYACC || APP_CONFIG.RECOVERY_ACCOUNT, // email to store keys to recovery accounts
      to, subject,
      text, html,
      attachments: [{
        filename: attachment.name,    // Name of the attachment
        content: attachment.data,     // Sanitized text content
        contentType: attachment.type, // MIME type of the attachment
      }]
    });

    return true;

  } catch (error) {
    console.error('Call Skate Hive Admin', error);
    return false;
  }

}
