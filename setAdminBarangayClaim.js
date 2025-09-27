import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Path to your service account key file
const serviceAccount = JSON.parse(
  readFileSync('./functions/barangaymed-firebase-adminsdk-fbsvc-d54b1b0fa0.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const targetUID = 'DT6BbnZ3MSZHm3bFJT6gC7s13f32';
const barangayId = '035406012';

async function setClaim() {
  try {
    const user = await admin.auth().getUser(targetUID);
    console.log(`Found user: ${user.email} (UID: ${user.uid})`);

    // Get existing claims
    const existingClaims = user.customClaims || {};

    // Set the custom claim
    const newClaims = {
      ...existingClaims,
      barangayId: barangayId
    };

    await admin.auth().setCustomUserClaims(user.uid, newClaims);
    console.log(`Custom claim 'barangayId: ${barangayId}' set for ${user.email}`);

    // Force token refresh
    await admin.auth().revokeRefreshTokens(user.uid);
    console.log(`Refresh tokens revoked for ${user.email}. User needs to re-authenticate.`);

    console.log('Operation completed successfully.');
  } catch (error) {
    console.error('Error setting custom claim:', error);
  }
}

setClaim();
