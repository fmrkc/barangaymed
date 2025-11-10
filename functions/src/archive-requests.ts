import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

async function archiveRequests(collectionName: string) {
  const now = new Date();
  const thirtyOneDaysAgo = new Date();
  thirtyOneDaysAgo.setDate(now.getDate() - 31);

  const requestsRef = db.collection(collectionName);
  // Query for documents that are older than 31 days and are not yet archived.
  // isShown might be true or not exist at all for older records, so we check for '!= false'
  const snapshot = await requestsRef
    .where('createdAt', '<=', thirtyOneDaysAgo)
    .where('isShown', '!=', false)
    .where('status', 'in', ['rejected', 'cancelled', 'no show', 'completed'])
    .get();

  if (snapshot.empty) {
    logger.info(`No requests to archive in ${collectionName}.`);
    return;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.update(doc.ref, { isShown: false });
  });

  await batch.commit();
  logger.info(`Archived ${snapshot.size} requests in ${collectionName}.`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const scheduledarchiverequests = onSchedule({
  schedule: "every day 00:00",
  timeZone: "Asia/Manila"
},
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async (_event) => {
  logger.info("Running scheduled archive function to hide old requests...");
  try {
    await archiveRequests('medicineRequests');
    await archiveRequests('teleconsultationRequests');
    logger.info("Scheduled archive function finished successfully.");
  } catch (error) {
    logger.error("Error running scheduled archive function:", error);
  }
});
