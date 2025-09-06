import { onCall, HttpsError } from "firebase-functions/v2/https";
import { sendEmail } from './email.js';

export const sendVerificationEmail = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { email, status, reason } = request.data;

  let subject: string;
  let htmlContent: string;

  if (status === 'approved') {
    subject = 'BarangayMed+ Account Approved!';
    htmlContent = `
      <p>Dear User,</p>
      <p>Good news! Your BarangayMed+ account has been approved.</p>
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
    });
    return { success: true, message: 'Email sent successfully.' };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new HttpsError('internal', 'Failed to send email.', error);
  }
});
