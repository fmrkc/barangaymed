import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { defineSecret } from 'firebase-functions/params';
import { sendEmail } from "../email.js";

const GMAIL_EMAIL = defineSecret('GMAIL_EMAIL');
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

export const submitFullRegistration = onCall(
  { 
    cors: [
      'http://localhost:8100',
      'http://localhost:8101',
      'https://barangaymed.web.app'
    ],
    secrets: [GMAIL_EMAIL, GMAIL_APP_PASSWORD] 
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const { registrationDetails } = request.data;
    const userId = request.auth.uid;
    const email = request.auth.token.email;

    if (!email || !registrationDetails) {
        throw new HttpsError(
            "invalid-argument",
            "Missing required fields: registrationDetails."
        );
    }

    const {
        lotBlkHouseNo, streetName, subdivisionVillageZonePurok, zipCode, contactNumber,
        barangayId, idVerificationUrl, idVerificationType
    } = registrationDetails;

    const subject = "BarangayMed+ Full Registration Request Received";
    const htmlContent = `
<p>Dear User,</p>
<p>Thank you for submitting your full registration request to BarangayMed+.</p>
<p>Your request has been successfully received and will be reviewed by our administrators soon.</p>
<p>Here are the details you submitted:</p>
<ul>
  <li><strong>Email:</strong> ${email}</li>
  <li><strong>Address:</strong> ${[lotBlkHouseNo, streetName, subdivisionVillageZonePurok, barangayId, zipCode].filter(Boolean).join(', ')}</li>
  <li><strong>Contact Number:</strong> ${contactNumber}</li>
  <li><strong>Barangay:</strong> ${barangayId}</li>
  ${idVerificationUrl ? `<li><strong>${idVerificationType}:</strong> <a href="${idVerificationUrl}">View Document</a></li>` : ''}
</ul>
<p>You will receive another notification once your request has been reviewed.</p>
<p>Sincerely,</p>
<p>The BarangayMed+ Team</p>
`;

    try {
        // Send email confirmation
        await sendEmail({
            to: email,
            subject: subject,
            html: htmlContent,
        }, GMAIL_EMAIL.value(), GMAIL_APP_PASSWORD.value());

        // Create notification in Firestore
        await admin.firestore().collection("notifications").add({
            userId: userId,
            title: "Full Registration Request Received",
            message: "Your full registration request has been received and is pending review.",
            type: "full_registration_status",
            read: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            details: registrationDetails, // Store all details for admin review if needed
        });

        return { success: true, message: "Full registration confirmation sent." };
    } catch (error) {
        console.error("Error sending full registration confirmation:", error);
        throw new HttpsError(
            "internal",
            "Failed to send confirmation."
        );
    }
});
