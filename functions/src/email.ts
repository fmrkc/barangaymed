import * as nodemailer from 'nodemailer';

// Define the interface for email options
interface MailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const GMAIL_EMAIL = process.env.GMAIL_EMAIL;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_EMAIL || !GMAIL_APP_PASSWORD) {
  console.error('GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables must be set.');
  // You might want to throw an error or handle this more gracefully in production
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_EMAIL,
    pass: GMAIL_APP_PASSWORD,
  },
});

export const sendEmail = async (options: MailOptions) => {
  const mailOptions = {
    from: `"BarangayMed+" <${GMAIL_EMAIL}>`,
    ...options,
  };
  await transporter.sendMail(mailOptions);
};
