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

export default function getSupportTemplate(
  userEmail: string,
  message: string,
  userAgent?: string,
  timestamp?: string
): string {
  const currentTime = timestamp || new Date().toISOString();
  const formattedTime = new Date(currentTime).toLocaleString();
  
  // Escape user inputs to prevent XSS
  const safeEmail = escapeHtml(userEmail);
  const safeMessage = escapeHtml(message);
  const safeUserAgent = userAgent ? escapeHtml(userAgent) : undefined;
  
  return `
    <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #FF6B35, #F7931E); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <img src="https://docs.skatehive.app/img/skatehive.png" alt="SkateHive" style="max-width: 60px; margin-bottom: 15px;">
        <h1 style="margin: 0; color: white; font-size: 26px;">New Support Request</h1>
        <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">SkateHive Mobile App</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <!-- Request Details -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #FF6B35;">
          <h3 style="margin: 0 0 15px; color: #333; font-size: 18px;">Request Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555; width: 120px;">From:</td>
              <td style="padding: 8px 0; color: #333;">${safeEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Submitted:</td>
              <td style="padding: 8px 0; color: #333;">${formattedTime}</td>
            </tr>
            ${safeUserAgent ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Device:</td>
              <td style="padding: 8px 0; color: #333; font-size: 12px;">${safeUserAgent}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <!-- Message Content -->
        <div style="margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px; color: #333; font-size: 18px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
            Message
          </h3>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
            <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
          </div>
        </div>

        <!-- Action Items -->
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h4 style="margin: 0 0 10px; color: #1976d2;">📋 Action Required</h4>
          <ul style="margin: 0; padding-left: 20px; color: #333; line-height: 1.6;">
            <li>Review the user's message and categorize the issue</li>
            <li>Respond within 24-48 hours during business days</li>
            <li>Use "Reply" to respond directly to: <strong>${safeEmail}</strong></li>
            <li>Update internal support tracking system if applicable</li>
          </ul>
        </div>

        <!-- Quick Response Templates -->
        <div style="background: #f1f8e9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h4 style="margin: 0 0 10px; color: #388e3c;">💡 Quick Response Guidelines</h4>
          <p style="margin: 0; color: #333; line-height: 1.6; font-size: 14px;">
            • <strong>Account Issues:</strong> Request specific details (username, last login, error messages)<br>
            • <strong>Technical Problems:</strong> Ask for device info, app version, steps to reproduce<br>
            • <strong>Feature Requests:</strong> Thank them and explain our development process<br>
            • <strong>General Questions:</strong> Provide helpful links to documentation or community resources
          </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">
            This support request was sent from the SkateHive mobile application<br>
            <a href="https://skatehive.app" style="color: #FF6B35; text-decoration: none;">skatehive.app</a>
          </p>
        </div>
      </div>
    </div>
  `;
}