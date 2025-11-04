
import axios from 'axios';
import * as functions from 'firebase-functions';

interface SmsOptions {
  to: string;
  message: string;
}

export const sendSms = async (options: SmsOptions) => {
  const apiKey = functions.config().iprogtech.apikey;
  if (!apiKey) {
    throw new Error('iProgTech API key is not configured.');
  }

  try {
    await axios.post('https://sms.iprogtech.com/api/v1/send', {
      apikey: apiKey,
      number: options.to,
      message: options.message,
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error('Failed to send SMS.');
  }
};
