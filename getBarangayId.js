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

async function getBarangayId() {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(targetUID).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`Barangay ID for user ${targetUID}: ${userData.barangayId}`);
      return userData.barangayId;
    } else {
      console.log(`User document not found for UID: ${targetUID}`);
      return null;
    }
  } catch (error) {
    console.error('Error getting barangay ID:', error);
    return null;
  }
}

getBarangayId();
