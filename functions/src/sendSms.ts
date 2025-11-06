import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from 'firebase-functions/params';
import axios from 'axios';
import { logger } from "firebase-functions/v2";

// Define secrets for SMS API key and sender ID
const SMS_API_KEY = defineSecret('SMS_API_KEY');
const SMS_SENDER_ID = defineSecret('SMS_SENDER_ID');

export const sendSmsNotification = onCall({ secrets: [SMS_API_KEY, SMS_SENDER_ID] }, async (request) => {
  // Ensure the request is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { recipientContactNumber, message } = request.data;

  // Validate input
  if (!recipientContactNumber || !message) {
    throw new HttpsError('invalid-argument', 'Missing required parameters: recipientContactNumber and message.');
  }

  // Basic validation for contact number format (e.g., starts with +63)
  if (!recipientContactNumber.startsWith('+63') || recipientContactNumber.length !== 13) {
    throw new HttpsError('invalid-argument', 'Invalid recipientContactNumber format. Must be +63XXXXXXXXXX.');
  }

  try {
    const apiKey = SMS_API_KEY.value();
    const senderId = SMS_SENDER_ID.value();

    if (!apiKey || !senderId) {
      logger.error('SMS API Key or Sender ID not configured.');
      throw new HttpsError('internal', 'SMS service not configured properly.');
    }

    const smsApiUrl = 'https://sms.iprogtech.com/api/v1/sms_messages';
    const formattedMobileNumber = recipientContactNumber.startsWith('+') ? recipientContactNumber.substring(1) : recipientContactNumber;

    const params = new URLSearchParams();
    params.append('api_key', apiKey);
    params.append('sender_id', senderId);
    params.append('message', message);
    params.append('mobile_number', formattedMobileNumber);

    logger.info(`Sending SMS to ${recipientContactNumber} with message: ${message}`);

    const response = await axios.post(smsApiUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    logger.info('SMS API response:', response.data);

    if (response.data && response.data.status === 'success') {
      return { success: true, message: 'SMS sent successfully!' };
    } else {
      logger.error('SMS API returned an error:', response.data);
      throw new HttpsError('internal', response.data.message || 'Failed to send SMS.');
    }
  } catch (error) {
    logger.error('Error sending SMS:', error);
    if (axios.isAxiosError(error) && error.response) {
      logger.error('SMS API detailed error:', error.response.data);
      throw new HttpsError('unavailable', `SMS service error: ${error.response.data.message || error.message}`);
    }
    throw new HttpsError('internal', 'Failed to send SMS notification.');
  }
});
