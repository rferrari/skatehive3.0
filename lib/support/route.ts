'use server'
import nodemailer from 'nodemailer';
import { htmlToText } from 'html-to-text';
import { APP_CONFIG, EMAIL_DEFAULTS } from '@/config/app.config';
import getSupportTemplate from './template';

interface SupportRequest {
  email: string;
  message: string;
  subject: string;
  userAgent?: string;
  timestamp?: string;
}

export default async function supportMailer(request: SupportRequest): Promise<boolean> {
  const { email, message, subject, userAgent, timestamp } = request;

  // Check if required email environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Missing email environment variables');
    throw new Error('Email environment variables (EMAIL_USER, EMAIL_PASS) must be set.');
  }

  // Create transporter object using exact same config as server-functions sendInvite
  const transporter = nodemailer.createTransport({
    service: 'gmail',  // This automatically sets host, port, and security settings for Gmail
    auth: {
      user: process.env.EMAIL_USER,  // Your Gmail address
      pass: process.env.EMAIL_PASS,  // Gmail App Password (generate from Google Account settings)
    },
  });

  try {
    // Get HTML template and convert to plain text
    const html = getSupportTemplate(email, message, userAgent, timestamp);
    const text = htmlToText(html, {
      preserveNewlines: true,
      wordwrap: 130,
    });

    // Send to support team
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER || EMAIL_DEFAULTS.FROM_ADDRESS,
      to: process.env.EMAIL_RECOVERYACC || process.env.EMAIL_USER || EMAIL_DEFAULTS.FROM_ADDRESS, // Support team email (using recovery account)
      replyTo: email, // Allow direct reply to user
      subject: `[SkateHive Support] ${subject}`,
      text,
      html,
    });

    console.log('Support email sent successfully:', info.messageId);
    
    // Send confirmation email to user
    try {
      const confirmationHtml = getConfirmationTemplate(email);
      const confirmationText = htmlToText(confirmationHtml, {
        preserveNewlines: true,
        wordwrap: 130,
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER || EMAIL_DEFAULTS.FROM_ADDRESS,
        to: email,
        subject: 'SkateHive Support - We received your message',
        text: confirmationText,
        html: confirmationHtml,
      });
    } catch (confirmationError) {
      console.warn('Failed to send confirmation email:', confirmationError);
      // Don't fail the whole request if confirmation fails
    }

    return true;
  } catch (error: any) {
    console.error('Support mailer error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
    
    // Provide more specific error information
    if (error.code === 'ESOCKET' && error.command === 'CONN') {
      console.error('Email connection error - possibly SSL/TLS issue or network connectivity');
    } else if (error.code === 'EAUTH') {
      console.error('Email authentication error - check EMAIL_USER and EMAIL_PASS');
    }
    
    return false;
  }
}

/**
 * Escapes HTML characters to prevent XSS attacks
 * @param text - The text to escape
 * @returns The escaped text safe for HTML insertion
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function getConfirmationTemplate(userEmail: string): string {
  const safeEmail = escapeHtml(userEmail);
  return `
    <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <img src="https://docs.skatehive.app/img/skatehive.png" alt="SkateHive" style="max-width: 60px; margin-bottom: 15px;">
        <h1 style="margin: 0; color: white; font-size: 24px;">Support Request Received</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Thank you for contacting SkateHive Support</h2>
        <p style="color: #666; line-height: 1.6;">
          We have received your support request and our team will review it shortly. 
          We typically respond within 24-48 hours during business days.
        </p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>Your email:</strong> ${safeEmail}<br>
            <strong>Request ID:</strong> ${Date.now()}-${Math.random().toString(36).slice(2, 11)}
          </p>
        </div>
        <p style="color: #666; line-height: 1.6;">
          If you have additional information or urgent concerns, please reply to this email.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_CONFIG.BASE_URL}" style="background: #4CAF50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 5px; display: inline-block;">
            Return to SkateHive
          </a>
        </div>
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>© {new Date().getFullYear()} SkateHive. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}