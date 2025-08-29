import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Path to your service account key file
// Make sure this path is correct relative to where this script is executed
const serviceAccount = JSON.parse(
  readFileSync('./functions/barangaymed-firebase-adminsdk-fbsvc-d54b1b0fa0.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const targetEmail = 'barangaymed@gmail.com';

async function setClaim() {
  try {
    const user = await admin.auth().getUserByEmail(targetEmail);
    console.log(`Found user: ${user.email} (UID: ${user.uid})`);

    // Set the custom claim
    await admin.auth().setCustomUserClaims(user.uid, { role: 'superadmin' });
    console.log(`Custom claim 'role: superadmin' set for ${user.email}`);

    // Force token refresh
    await admin.auth().revokeRefreshTokens(user.uid);
    console.log(`Refresh tokens revoked for ${user.email}. User needs to re-authenticate.`);

    console.log('Operation completed successfully.');
  } catch (error) {
    console.error('Error setting custom claim:', error);
  }
}

setClaim();