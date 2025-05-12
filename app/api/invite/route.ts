import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { htmlToText } from 'html-to-text';
import getMailTemplate_Invite from '@/lib/invite/template';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      subject,
      createdby,
      desiredUsername,
      masterPassword,
      keys,
      language
    } = body;

    // Create transporter object using nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Get HTML template and convert to plain text
    const html = getMailTemplate_Invite(createdby, desiredUsername, masterPassword, keys, language);
    const text = htmlToText(html, { preserveNewlines: true });

    // Define the attachment object
    const attachment = {
      name: `KEYS-BACKUP-${desiredUsername}-SKATEHIVE.TXT`,
      data: text,
      type: 'text/plain',
    };

    await transporter.sendMail({
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invite API error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
} 