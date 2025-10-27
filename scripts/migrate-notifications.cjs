
const admin = require('firebase-admin');
const serviceAccount = require('../functions/barangaymed-firebase-adminsdk-fbsvc-d54b1b0fa0.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateNotifications() {
  console.log('Starting notification migration...');

  const usersSnapshot = await db.collection('users').get();
  if (usersSnapshot.empty) {
    console.log('No users found.');
    return;
  }

  let totalMigrated = 0;
  const rootNotificationsRef = db.collection('notifications');

  // Using a for...of loop to handle async operations correctly
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const oldNotificationsRef = userDoc.ref.collection('notifications');
    const oldNotificationsSnapshot = await oldNotificationsRef.get();

    if (oldNotificationsSnapshot.empty) {
      // console.log(`No notifications to migrate for user ${userId}`);
      continue;
    }

    const batch = db.batch();
    let migratedForUser = 0;

    oldNotificationsSnapshot.forEach(notificationDoc => {
      const notificationData = notificationDoc.data();
      const newNotificationRef = rootNotificationsRef.doc(); // Create a new doc with a unique ID

      const newNotificationData = {
        ...notificationData,
        userId: userId, // Add the userId to the document data
        timestamp: notificationData.timestamp || admin.firestore.FieldValue.serverTimestamp() // Ensure timestamp exists
      };

      batch.set(newNotificationRef, newNotificationData);
      batch.delete(notificationDoc.ref); // Delete the old notification
      migratedForUser++;
    });

    await batch.commit();
    if (migratedForUser > 0) {
      console.log(`Successfully migrated and deleted ${migratedForUser} notifications for user ${userId}`);
      totalMigrated += migratedForUser;
    }
  }

  console.log(`
Migration complete!`);
  console.log(`Total notifications migrated: ${totalMigrated}`);
}

migrateNotifications().catch(error => {
  console.error('Error during migration:', error);
  process.exit(1);
});
