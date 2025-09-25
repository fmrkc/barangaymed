import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from 'firebase-functions/params';
import { sendEmail } from './email.js';

const GMAIL_EMAIL = defineSecret('GMAIL_EMAIL');
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

export const sendVerificationEmail = onCall( 
  { secrets: [GMAIL_EMAIL, GMAIL_APP_PASSWORD] },
  async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { email, status, reason } = request.data;

  let subject: string;
  let htmlContent: string;

  if (status === 'approved' || status === 'verified') {
    subject = 'BarangayMed+ Account Verified!';
    htmlContent = `
      <p>Dear User,</p>
      <p>Good news! Your BarangayMed+ account has been verified.</p>
      <p>You can now log in and access all features of the application.</p>
      <p>Thank you for your patience.</p>
      <p>Sincerely,</p>
      <p>The BarangayMed+ Team</p>
    `;
  } else if (status === 'rejected') {
    subject = 'BarangayMed+ Account Verification Update';
    htmlContent = `
      <p>Dear User,</p>
      <p>We regret to inform you that your BarangayMed+ account verification has been rejected.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ''}
      <p>Please review the requirements and try again if you wish.</p>
      <p>Sincerely,</p>
      <p>The BarangayMed+ Team</p>
    `;
  } else {
    throw new HttpsError('invalid-argument', 'Invalid verification status.');
  }

  try {
    await sendEmail({
      to: email,
      subject: subject,
      html: htmlContent,
    }, GMAIL_EMAIL.value(), GMAIL_APP_PASSWORD.value());
    return { success: true, message: 'Email sent successfully.' };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new HttpsError('internal', 'Failed to send email.', error);
  }
});
