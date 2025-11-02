import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

class EventService {
  private static instance: EventService;

  private constructor() {}

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  /**
   * Publishes an event to the backend.
   * @param eventType The type of the event (e.g., 'user.login.success').
   * @param data The data payload for the event.
   */
  async publishEvent(eventType: string, data: any): Promise<void> {
    try {
      const publishBarangayMedEvent = httpsCallable(functions, 'publishBarangayMedEvent');
      await publishBarangayMedEvent({ eventType, data });
    } catch (error) {
      console.error(`Failed to publish event: ${eventType}`, error);
      // Depending on requirements, you might want to handle this more gracefully
      // For now, we log the error and continue.
    }
  }
}

export const eventService = EventService.getInstance();