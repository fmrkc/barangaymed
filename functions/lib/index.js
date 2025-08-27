"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnlyOperation = exports.setUserRole = exports.logActivity = exports.setroleonusercreate = exports.createAdmin = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
admin.initializeApp();
// Export the createAdmin function
var createAdminUser_1 = require("./createAdminUser");
Object.defineProperty(exports, "createAdmin", { enumerable: true, get: function () { return createAdminUser_1.createAdmin; } });
/**
 * On user creation, set custom claims based on the user's role in Firestore.
 * This function reads the user document from Firestore to determine the role
 * and sets appropriate custom claims including role and barangayId if applicable.
 */
exports.setroleonusercreate = functions.auth.user().onCreate(async (user) => {
    try {
        // Get the user document from Firestore
        const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const role = (userData === null || userData === void 0 ? void 0 : userData.role) || 'user';
            const barangayId = (userData === null || userData === void 0 ? void 0 : userData.barangayId) || null;
            // Prepare custom claims
            const customClaims = { role };
            // Add barangayId to claims if user is an admin
            if (barangayId && (role === 'admin' || role === 'super_admin')) {
                customClaims.barangayId = barangayId;
            }
            // Set custom claims
            await admin.auth().setCustomUserClaims(user.uid, customClaims);
            firebase_functions_1.logger.log(`Custom claims set for user ${user.uid}:`, customClaims);
        }
        else {
            // Default to user role if no document exists
            await admin.auth().setCustomUserClaims(user.uid, { role: "user" });
            firebase_functions_1.logger.log(`Default custom claim 'role: user' set for user: ${user.uid}`);
        }
    }
    catch (error) {
        firebase_functions_1.logger.error("Error setting custom claims:", error);
    }
});
/**
 * HTTP Cloud Function to log activities securely
 * This function accepts log data and writes it to Firestore with server-side permissions
 */
exports.logActivity = functions.https.onCall(async (data, context) => {
    // Validate that the request is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Only authenticated users can log activities');
    }
    // Validate required fields
    const { action, userId, userEmail, role, details } = data;
    if (!action || !userId || !userEmail || !role || !details) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: action, userId, userEmail, role, details');
    }
    try {
        // Create the log entry with server timestamp
        const logEntry = {
            action,
            userId,
            userEmail,
            role,
            details,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            // Add additional metadata for security
            authUid: context.auth.uid,
            authTime: new Date().toISOString()
        };
        // Write to Firestore
        await admin.firestore().collection('logs').add(logEntry);
        return { success: true, message: 'Activity logged successfully' };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error logging activity:', error);
        throw new functions.https.HttpsError('internal', 'Failed to log activity');
    }
});
/**
 * Callable function to set a user's role.
 * Only callable by users with the 'superadmin' role.
 * @param {object} data - The data passed to the function.
 * @param {string} data.email - The email of the user to modify.
 * @param {string} data.newRole - The new role to assign ('admin' or 'user').
 * @param {string} [data.barangayId] - The barangayId, required if the new role is 'admin'.
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
    var _a, _b;
    // 1. Authentication and Authorization Check
    // Ensure the user is authenticated and is a superadmin.
    if (((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.role) !== 'superadmin') {
        firebase_functions_1.logger.error("Attempt to set role by non-superadmin:", { uid: (_b = context.auth) === null || _b === void 0 ? void 0 : _b.uid });
        throw new functions.https.HttpsError('permission-denied', 'You must be a superadmin to perform this action.');
    }
    const { email, newRole, barangayId } = data;
    // 2. Input Validation
    if (!email || !newRole || (newRole === 'admin' && !barangayId)) {
        throw new functions.https.HttpsError('invalid-argument', 'Required fields are missing: email, newRole, and barangayId (for admins).');
    }
    if (!['admin', 'user'].includes(newRole)) {
        throw new functions.https.HttpsError('invalid-argument', 'Role must be either "admin" or "user".');
    }
    try {
        // 3. Set Custom Claims
        const userToUpdate = await admin.auth().getUserByEmail(email);
        const claims = { role: newRole };
        if (newRole === 'admin') {
            claims.barangayId = barangayId;
        }
        await admin.auth().setCustomUserClaims(userToUpdate.uid, claims);
        // 4. Update Firestore Document (to keep data consistent)
        await admin.firestore().collection('users').doc(userToUpdate.uid).update(claims);
        firebase_functions_1.logger.log(`Successfully set role for ${email} to ${newRole}`, claims);
        return { success: true, message: `Role for ${email} updated to ${newRole}.` };
    }
    catch (error) {
        firebase_functions_1.logger.error("Error in setUserRole:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while setting the user role.');
    }
});
/**
 * Example of a protected callable function.
 * Only accessible by users with 'admin' or 'superadmin' roles.
 */
exports.adminOnlyOperation = functions.https.onCall((data, context) => {
    var _a, _b, _c, _d;
    // Check for authentication and role.
    const role = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.role;
    if (!role || (role !== 'admin' && role !== 'superadmin')) {
        firebase_functions_1.logger.error("Unauthorized access attempt to adminOnlyOperation:", { uid: (_b = context.auth) === null || _b === void 0 ? void 0 : _b.uid });
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to perform this action.');
    }
    // If the check passes, proceed with the function's logic.
    firebase_functions_1.logger.log(`Admin operation performed by:`, { uid: (_c = context.auth) === null || _c === void 0 ? void 0 : _c.uid, role: role });
    // Example: Return some data only admins should see.
    return {
        success: true,
        message: "Welcome, admin! Here is the secret data.",
        data: {
            superSecretValue: 12345,
            requestingUserBarangay: ((_d = context.auth) === null || _d === void 0 ? void 0 : _d.token.barangayId) || 'N/A'
        }
    };
});
//# sourceMappingURL=index.js.map