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
exports.createAdmin = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
/**
 * Callable function to create admin/superadmin users.
 * Only callable by users with the 'superadmin' role.
 * @param {object} data - The data passed to the function.
 * @param {string} data.email - The email of the user to create.
 * @param {string} data.password - The password for the new user.
 * @param {string} data.fullName - The full name of the new user.
 * @param {string} data.role - The role to assign ('admin' or 'superadmin').
 * @param {string} data.barangay - The barangay, required if the role is 'admin'.
 */
exports.createAdmin = functions.https.onCall(async (data, context) => {
    var _a, _b;
    // 1. Authentication and Authorization Check
    // Ensure the user is authenticated and is a superadmin.
    if (((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.role) !== 'superadmin') {
        firebase_functions_1.logger.error("Attempt to create admin by non-superadmin:", {
            uid: (_b = context.auth) === null || _b === void 0 ? void 0 : _b.uid,
            attemptedRole: data.role
        });
        throw new functions.https.HttpsError('permission-denied', 'You must be a superadmin to perform this action.');
    }
    const { email, password, fullName, role, barangay } = data;
    // 2. Input Validation
    if (!email || !password || !fullName || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'Required fields are missing: email, password, fullName, role.');
    }
    if (!['admin', 'superadmin'].includes(role)) {
        throw new functions.https.HttpsError('invalid-argument', 'Role must be either "admin" or "superadmin".');
    }
    if (role === 'admin' && !barangay) {
        throw new functions.https.HttpsError('invalid-argument', 'Barangay is required for admin role.');
    }
    try {
        // 3. Create the user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: fullName,
            emailVerified: false
        });
        // 4. Prepare custom claims
        const customClaims = { role };
        // Add barangay to claims if user is an admin
        if (role === 'admin' && barangay) {
            customClaims.barangayId = barangay;
        }
        // 5. Set custom claims
        await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
        // 6. Create user document in Firestore (server-side, bypasses security rules)
        const userDocData = {
            uid: userRecord.uid,
            email: email,
            name: fullName,
            role: role,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: context.auth.uid,
            createdByEmail: context.auth.token.email
        };
        // Add barangay data for admin users
        if (role === 'admin' && barangay) {
            userDocData.barangayId = barangay;
            userDocData.barangay = barangay;
        }
        await admin.firestore().collection('users').doc(userRecord.uid).set(userDocData);
        // 7. Log the creation event
        firebase_functions_1.logger.log(`Successfully created ${role} user:`, {
            email,
            uid: userRecord.uid,
            createdBy: context.auth.uid,
            barangay: role === 'admin' ? barangay : 'N/A'
        });
        return {
            success: true,
            message: `${role} user created successfully.`,
            userId: userRecord.uid,
            email: email
        };
    }
    catch (error) {
        firebase_functions_1.logger.error("Error creating admin user:", error);
        // Handle specific error cases
        if (error instanceof Error) {
            if (error.message.includes('email already exists')) {
                throw new functions.https.HttpsError('already-exists', 'A user with this email already exists.');
            }
            if (error.message.includes('password')) {
                throw new functions.https.HttpsError('invalid-argument', 'Password does not meet requirements.');
            }
        }
        throw new functions.https.HttpsError('internal', 'An error occurred while creating the user.');
    }
});
//# sourceMappingURL=createAdminUser.js.map