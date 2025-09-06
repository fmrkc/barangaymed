import * as nodemailer from 'nodemailer';

// Define the interface for email options
interface MailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async (options: MailOptions, user: string, pass: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mailOptions = {
    from: `"BarangayMed+" <${user}>`,
    ...options,
  };
  await transporter.sendMail(mailOptions);
};
