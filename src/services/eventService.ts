
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Define a generic event publishing function
const publishEvent = httpsCallable(functions, 'publishEvent');

/**
 * Publishes an event to the event bus.
 * @param eventType The type of event (e.g., 'user.registration.approved').
 * @param data The event payload.
 */
export const dispatchEvent = async (eventType: string, data: object) => {
  try {
    await publishEvent({ eventType, data });
    console.log(`Event '${eventType}' published successfully.`);
  } catch (error) {
    console.error(`Error publishing event '${eventType}':`, error);
    // Optionally, handle the error more gracefully (e.g., show a toast to the user)
  }
};
