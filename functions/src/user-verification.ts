import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin"; // Changed to default import

export const setCustomClaimsOnVerification = onCall(
  {
    cors: [
      "http://localhost:8100",
      "http://localhost:8101",
      "https://barangaymed.web.app",
    ],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const adminUID = request.auth.uid;
    const { userId, action, barangayId } = request.data;

    if (!userId || !action || (action === "verified" && !barangayId)) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: userId, action, and barangayId for verification."
      );
    }

    try {
      const adminUser = await admin.auth().getUser(adminUID);
      const isAdmin = adminUser.customClaims?.role === "admin";

      if (!isAdmin) {
        throw new HttpsError(
          "permission-denied",
          "Only admins can perform this action."
        );
      }

      let claimsToSet = {};
      if (action === "verified") {
        claimsToSet = {
          role: "user",
          verificationStatus: "verified",
          barangayId: barangayId,
        };
      } else if (action === "rejected") {
        claimsToSet = {
          ...adminUser.customClaims,
          verificationStatus: "rejected",
        };
      }

      await admin.auth().setCustomUserClaims(userId, claimsToSet);

      return { success: true, message: `User ${action} successfully.` };
    } catch (error) {
      console.error("Error updating custom claims:", error);
      throw new HttpsError(
        "internal",
        "Failed to update custom claims."
      );
    }
  }
);