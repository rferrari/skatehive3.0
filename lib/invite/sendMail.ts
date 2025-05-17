import nodemailer from 'nodemailer';
import { htmlToText } from 'html-to-text';
import getMailTemplate_Invite from './template';

export default async function sendMail(
  to: string,
  subject: string,
  createdby: string,
  desiredUsername: string,
  masterPassword: string,
  keys: any,
  language: string
) {
  // Create transporter object using nodemailer
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    // Get HTML template and convert to plain text
    const html = getMailTemplate_Invite(
      createdby,
      desiredUsername,
      masterPassword,
      keys,
      language
    );
    const text = htmlToText(html, {
      preserveNewlines: true,
    });

    // Define the attachment object
    const attachment = {
      name: `KEYS-BACKUP${desiredUsername}-SKATEHIVE.TXT`,
      data: text,
      type: 'text/plain',
    };

    const info = await transporter.sendMail({
      from: process.env.EMAIL_COMMUNITY,
      bcc: process.env.EMAIL_RECOVERYACC,
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: attachment.name,
          content: attachment.data,
          contentType: attachment.type,
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Call Skate Hive Admin', error);
    return false;
  }
} 