import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from 'firebase-functions/params';
import axios from 'axios';
import { logger } from "firebase-functions/v2";

// Define secrets for SMS API key and sender ID
const SMS_API_KEY = defineSecret('SMS_API_KEY');

export const sendSmsNotification = onCall({ secrets: [SMS_API_KEY] }, async (request) => {
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

    if (!apiKey) {
      logger.error('SMS API Key not configured.');
      throw new HttpsError('internal', 'SMS service not configured properly.');
    }

    const formattedMobileNumber = recipientContactNumber.startsWith('+') ? recipientContactNumber.substring(1) : recipientContactNumber;

    const smsApiUrl = `https://sms.iprogtech.com/api/v1/sms_messages?api_token=${apiKey}&phone_number=${formattedMobileNumber}&message=${encodeURIComponent(message)}`;

    logger.info(`Sending SMS to ${formattedMobileNumber} with message: ${message}`);

    const response = await axios.post(smsApiUrl, null, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.info('SMS API response:', response.data);

    if (response.data && response.data.status === 200) {
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
