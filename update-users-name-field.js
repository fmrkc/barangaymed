const admin = require('firebase-admin');

// IMPORTANT: Make sure the path to your Firebase service account key JSON file is correct.
const serviceAccount = require('./functions/barangaymed-firebase-adminsdk-fbsvc-d54b1b0fa0.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateUsers() {
  const usersRef = db.collection('users');
  console.log('Fetching all users...');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log('No users found to update.');
    return;
  }

  let updatedCount = 0;
  const promises = [];

  snapshot.forEach(doc => {
    const userData = doc.data();
    const { firstName, middleName, lastName, name } = userData;

    // Skip if the 'name' field already exists and is a non-empty string
    if (typeof name === 'string' && name.length > 0) {
      console.log(`Skipping user ${doc.id} - 'name' field already exists.`);
      return;
    }

    if (firstName && lastName) {
      const newName = [firstName, middleName, lastName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const promise = doc.ref.update({ name: newName }).then(() => {
        console.log(`Successfully updated user ${doc.id} with name: "${newName}"`);
        updatedCount++;
      }).catch(error => {
        console.error(`Failed to update user ${doc.id}:`, error);
      });
      promises.push(promise);
    } else {
        console.log(`Skipping user ${doc.id} due to missing firstName or lastName.`);
    }
  });

  await Promise.all(promises);

  console.log(`
Update complete. ${updatedCount} user(s) were successfully updated.`);
}

updateUsers().catch(error => {
    console.error("An error occurred during the update process:", error);
});
