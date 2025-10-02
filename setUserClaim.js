import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Path to your service account key file
const serviceAccount = JSON.parse(
  readFileSync('./functions/barangaymed-firebase-adminsdk-fbsvc-d54b1b0fa0.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const targetUID = 'o3fwJLmSLPc817aiIRbkGitfzHa2';

async function setClaim() {
  try {
    const user = await admin.auth().getUser(targetUID);
    console.log(`Found user: ${user.email} (UID: ${user.uid})`);

    // Set the custom claims
    await admin.auth().setCustomUserClaims(user.uid, { role: 'user', verificationStatus: 'verified', barangayId: '035406012' });
    console.log(`Custom claims set for ${user.email}: role: user, verificationStatus: verified, barangayId: 035406012`);

    // Force token refresh
    await admin.auth().revokeRefreshTokens(user.uid);
    console.log(`Refresh tokens revoked for ${user.email}. User needs to re-authenticate.`);

    console.log('Operation completed successfully.');
  } catch (error) {
    console.error('Error setting custom claim:', error);
  }
}

setClaim();
