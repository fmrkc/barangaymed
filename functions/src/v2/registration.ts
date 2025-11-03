import admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as nodemailer from 'nodemailer';
import { PubSub } from "@google-cloud/pubsub";

let pubsub: PubSub;

const getPubSub = () => {
  if (!pubsub) {
    pubsub = new PubSub();
  }
  return pubsub;
};
import { randomBytes } from "crypto";
import { defineSecret } from 'firebase-functions/params';
import addressesDataRaw from '../data/philippine-addresses.json' with { type: 'json' };


const GMAIL_EMAIL = defineSecret('GMAIL_EMAIL');
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

// Helper to generate a random password
const generatePassword = (length = 12) => {
    return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

// Helper to generate a random role-based email
const generateRoleBasedEmail = (role: string, domain = "barangaymed.app") => {
    const randomString = randomBytes(4).toString('hex');
    return `${role}.${randomString}@${domain}`;
};

// Address Data Loading and Processing
interface BarangayData {
    code: string;
    name: string;
}

interface CityMunData {
    name: string;
    barangay_list: BarangayData[];
}

interface ProvinceData {
    name: string;
    municipality_list: { [key: string]: CityMunData };
}

interface RegionData {
    region_name: string;
    province_list: { [key: string]: ProvinceData };
}

interface AddressesDataType {
    [key: string]: RegionData;
}

let addressesData: AddressesDataType | null = null;
let barangayToCityMunMap: Map<string, string> | null = null;
let codeToNameMap: Map<string, string> | null = null;

const loadAddressesData = async () => {
    if (addressesData) return;
    try {
        addressesData = addressesDataRaw as AddressesDataType;

        // Pre-process data for efficient lookups
        barangayToCityMunMap = new Map<string, string>();
        codeToNameMap = new Map<string, string>();

        for (const regionCode in addressesData) {
            const region = addressesData[regionCode];
            codeToNameMap.set(regionCode, region.region_name);
            for (const provinceCode in region.province_list) {
                const province = region.province_list[provinceCode];
                codeToNameMap.set(provinceCode, province.name);
                for (const cityMunCode in province.municipality_list) {
                    const cityMun = province.municipality_list[cityMunCode];
                    codeToNameMap.set(cityMunCode, cityMun.name);
                    for (const brgy of cityMun.barangay_list) {
                        barangayToCityMunMap.set(brgy.code, cityMunCode);
                        codeToNameMap.set(brgy.code, brgy.name);
                    }
                }
            }
        }
        logger.info("Successfully loaded and processed Philippine addresses data.");
    } catch (error) {
        logger.error("Failed to load or process philippine-addresses.json", error);
        throw new HttpsError('internal', 'Could not load address data. Please try again later.');
    }
};

const getCityMunicipalityIdFromBarangayId = (barangayId: string): string | undefined => {
    return barangayToCityMunMap?.get(barangayId);
};

const getNameFromCode = (code: string): string | undefined => {
    return codeToNameMap?.get(code);
};


import { CallableRequest } from "firebase-functions/v2/https";

// ... (existing imports)

interface ProvisionUserV2Data {
    contactEmail: string;
    role: string;
    barangayId: string;
    barangayName?: string;
    cityMunicipalityId: string;
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
    birthdate: string;
    gender: string;
    address: string;
    assignedLocation: string;
    specificRole: string;
    fullName: string;
    regionId: string;
    provinceId: string;
    creatorEmail: string;
    creatorDisplayName: string;
    regionName: string;
    provinceName: string;
    cityMunicipalityName: string;
}

export const provisionUserV2 = async (request: CallableRequest<ProvisionUserV2Data>) => {
    await loadAddressesData();
    logger.info("provisionUserV2 started");
    logger.info("Incoming request data:", request.data);
    if (request.auth?.token.role !== 'superadmin' && request.auth?.token.email !== 'barangaymed@gmail.com') {
        logger.error("Attempt to provision user by non-authorized user:", {
            uid: request.auth?.uid,
            email: request.auth?.token.email
        });
        throw new HttpsError(
            'permission-denied',
            'You are not authorized to perform this action.'
        );
    }

    const { 
        contactEmail, role, barangayId, cityMunicipalityId, 
        firstName, middleName, lastName, suffix, birthdate, gender, 
        address, assignedLocation, specificRole, fullName, regionId, provinceId, creatorEmail, creatorDisplayName,
        regionName, provinceName, cityMunicipalityName, barangayName
    } = request.data;

    logger.info("Request data destructured", request.data);

    let finalBarangayName = barangayName;
    if (role === 'admin' && barangayId && !finalBarangayName) {
        finalBarangayName = getNameFromCode(barangayId);
    }

    // --- Validation ---
    if (!contactEmail || !role || !fullName || !birthdate || !gender) {
        throw new HttpsError('invalid-argument', 'Missing required fields: contactEmail, fullName, birthdate, gender, and role.');
    }
    if (role === 'admin' && (!address || !barangayId || !assignedLocation)) {
        throw new HttpsError('invalid-argument', 'Missing required fields for admin: address, barangayId, assignedLocation.');
    }
    if (role === 'superadmin' && (!address || !cityMunicipalityId)) {
        throw new HttpsError('invalid-argument', 'Missing required fields for superadmin: address, cityMunicipalityId.');
    }
    if (!['admin', 'superadmin'].includes(role)) {
        throw new HttpsError('invalid-argument', 'Role must be either \'admin\' or \'superadmin\'.');
    }

    logger.info("Validation passed");

    // --- Authorization Check for Superadmins ---
    if (request.auth?.token.role === 'superadmin') {
        const superadminCityMunicipalityId = request.auth.token.cityMunicipalityId;
        if (role === 'admin') {
            const newAdminBarangayCityMunId = getCityMunicipalityIdFromBarangayId(barangayId);
            if (!superadminCityMunicipalityId || newAdminBarangayCityMunId !== superadminCityMunicipalityId) {
                throw new HttpsError(
                    'permission-denied',
                    'You can only create admins within your assigned city/municipality.'
                );
            }
        }
    }

    logger.info("Authorization passed");

    const generatedEmail = generateRoleBasedEmail(role);
    const temporaryPassword = generatePassword();
    let userRecord;

    try {
        logger.info("Creating user in Firebase Auth...");
        userRecord = await admin.auth().createUser({
            email: generatedEmail,
            password: temporaryPassword,
            displayName: fullName,
            emailVerified: true,
        });
        logger.info("User created in Firebase Auth", { uid: userRecord.uid });

        // --- Set Custom Claims ---
        const customClaims: { role: string; barangayId?: string; cityMunicipalityId?: string; verificationStatus: string } = {
            role,
            verificationStatus: 'verified'
        };
        if (role === 'admin') {
            customClaims.barangayId = barangayId;
            const cityMunId = await getCityMunicipalityIdFromBarangayId(barangayId);
            if (cityMunId) {
                customClaims.cityMunicipalityId = cityMunId;
            } else {
                logger.warn(`Could not find city/municipality for barangay ID: ${barangayId}`);
            }
        } else if (role === 'superadmin') {
            customClaims.cityMunicipalityId = cityMunicipalityId;
        }
        await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
        logger.info("Custom claims set", { uid: userRecord.uid, claims: customClaims });


        // --- Create Firestore Document ---
        const userData = {
            uid: userRecord.uid,
            email: generatedEmail,
            name: fullName,
            firstName,
            middleName,
            lastName,
            suffix,
            birthdate,
            gender,
            address,
            role: role,
            barangayId: role === 'admin' ? barangayId : null,
            barangayName: finalBarangayName || null,
            cityMunicipalityId: role === 'superadmin' ? cityMunicipalityId : (customClaims.cityMunicipalityId || null),
            regionId: regionId,
            provinceId: provinceId,
            regionName: regionName,
            provinceName: provinceName,
            cityMunicipalityName: cityMunicipalityName,
            assignedLocation: role === 'admin' ? assignedLocation : null,
            specificRole: role === 'admin' ? specificRole : null,
            contactEmail: contactEmail,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: request.auth.uid,
            creatorEmail: creatorEmail,
            creatorDisplayName: creatorDisplayName,
            verificationStatus: 'verified',
        };
        await admin.firestore().collection('users').doc(userRecord.uid).set(userData);
        logger.info("Firestore document created", { uid: userRecord.uid, data: userData });

        // Publish a Pub/Sub event
        try {
          const topic = getPubSub().topic("barangaymed-events");
          await topic.publishMessage({
            attributes: { eventType: "user.registration.approved" },
            json: { userId: userRecord.uid },
          });
          logger.info(`Published 'user.registration.approved' event for user ${userRecord.uid}`);
        } catch (error) {
          logger.error(`Error publishing Pub/Sub event for user ${userRecord.uid}:`, error);
          // We don't re-throw here as the user creation was successful.
          // The notification is a secondary concern.
        }


        // --- Send Email ---
        if (!process.env.FUNCTIONS_EMULATOR) {
            if (!contactEmail) {
                throw new HttpsError('internal', 'Contact email is missing before sending email.');
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: GMAIL_EMAIL.value(),
                    pass: GMAIL_APP_PASSWORD.value(),
                },
            });
            logger.info("Nodemailer transporter created");

            let assignedLocationText = '';
            if (role === 'admin') {
                const barangayName = await getNameFromCode(barangayId);
                assignedLocationText = `<p><b>Assigned Barangay:</b> ${barangayName || 'N/A'}</p>`;
            } else if (role === 'superadmin') {
                const cityName = await getNameFromCode(cityMunicipalityId);
                assignedLocationText = `<p><b>Assigned City/Municipality:</b> ${cityName || 'N/A'}</p>`;
            }

            const mailOptions = {
                from: `"BarangayMed+" <${GMAIL_EMAIL.value()}>`,
                to: contactEmail,
                subject: 'Your BarangayMed+ Account Credentials',
                html: `
                  <p>Hello ${fullName},</p>
                  <p>An account has been created for you on BarangayMed+.</p>
                  <p><b>Role:</b> ${role}</p>
                  ${assignedLocationText}
                  <hr>
                  <p>You can log in using these credentials:</p>
                  <p><b>Email:</b> ${generatedEmail}</p>
                  <p><b>Temporary Password:</b> ${temporaryPassword}</p>
                  <hr>
                  <p>Please change your password after your first login.</p>
                `,
            };

            await transporter.sendMail(mailOptions);
            logger.info("Email sent successfully");
        } else {
            logger.info("Skipping email sending in emulator environment.");
        }

        return { success: true, message: `User created successfully. Credentials sent to ${contactEmail}.`, newUser: { uid: userRecord.uid, email: generatedEmail } };

    } catch (error: unknown) {
        logger.error("Error provisioning user:", error);

        // Cleanup created user if process fails
        if (userRecord) {
            try {
                await admin.auth().deleteUser(userRecord.uid);
                await admin.firestore().collection('users').doc(userRecord.uid).delete();
                logger.log(`Successfully cleaned up partially created user: ${userRecord.email}`);
            } catch (cleanupError) {
                logger.error(`Failed to cleanup partially created user ${userRecord.email}:`, cleanupError);
            }
        }
        
        if (error instanceof HttpsError) {
            throw error;
        }
        
        throw new HttpsError('internal', 'An unexpected error occurred while creating the user.');
    }
};