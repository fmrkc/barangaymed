import React, { useState } from 'react';
import { IonButton, IonInput, IonItem, IonLabel, IonText, IonTextarea } from '@ionic/react';
import { TeleconsultationRequestService } from '../../../services/teleconsultationRequestService';
import { TeleconsultationRequestError } from '../../../types/teleconsultationRequests';
import { FirestoreOperationError } from '../../../utils/firestoreErrorHandler';
import { logEvent } from '../../../utils/logger';

interface TeleconsultationRequestFormProps {
  userId: string;
  userData: {
    firstName: string;
    lastName: string;
    contactNumber?: string;
    email?: string;
  };
  onRequestSent: () => void;
}

const TeleconsultationRequestForm: React.FC<TeleconsultationRequestFormProps> = ({ userId, userData, onRequestSent }) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      logEvent('info', `[TELECONSULTATION_FORM] Submitting request`, {
        userId,
        reasonLength: reason.trim().length
      });

      const service = TeleconsultationRequestService.getInstance();

      // ✅ build request object without undefined
      const request: any = {
        userId,
        userData,
        reason: reason.trim(),
      };
      notes: notes.trim(), //  always include notes field, never undefined`n      };

      await service.createRequest(request);

      logEvent('info', `[TELECONSULTATION_FORM] Request submitted successfully`, { userId });
      onRequestSent();
    } catch (err) {
      logEvent('error', `[TELECONSULTATION_FORM] Request submission failed`, {
        userId,
        error: err
      });

      if (err instanceof FirestoreOperationError) {
        const metadata = err.metadata as any;

        switch (metadata?.errorType) {
          case TeleconsultationRequestError.USER_NOT_VERIFIED:
            setError('Your account needs to be verified before you can submit teleconsultation requests. Please complete your registration verification first.');
            break;
          case TeleconsultationRequestError.PERMISSION_DENIED:
            setError('You do not have permission to submit teleconsultation requests. Please contact support for assistance.');
            break;
          case TeleconsultationRequestError.NETWORK_ERROR:
            setError('Network error occurred. Please check your internet connection and try again.');
            break;
          case TeleconsultationRequestError.INVALID_DATA:
            setError('Invalid request data. Please check your input and try again.');
            break;
          default:
            setError(err.message || 'Failed to send request. Please try again.');
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to send request: ${errorMessage}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <IonItem>
        <IonLabel position="floating">Reason for Request *</IonLabel>
        <IonTextarea
          value={reason}
          onIonChange={e => setReason(e.detail.value!)}
          required
          rows={3}
          disabled={submitting}
        />
      </IonItem>
      <IonItem>
        <IonLabel position="floating">Notes (Optional)</IonLabel>
        <IonTextarea
          value={notes}
          onIonChange={e => setNotes(e.detail.value!)}
          rows={3}
          disabled={submitting}
        />
      </IonItem>
      {error && <IonText color="danger" className="ion-padding">{error}</IonText>}
      <IonButton expand="block" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Sending...' : 'Submit Request'}
      </IonButton>
    </>
  );
};

export default TeleconsultationRequestForm;




















































