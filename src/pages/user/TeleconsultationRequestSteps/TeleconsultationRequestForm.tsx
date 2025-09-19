import React, { useState } from 'react';
import { IonButton, IonInput, IonItem, IonLabel, IonText, IonTextarea } from '@ionic/react';
import { TeleconsultationRequestService } from '../../../services/teleconsultationRequestService';
import { TeleconsultationRequestStatus } from '../../../types/teleconsultationRequests';

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
      const service = TeleconsultationRequestService.getInstance();
      await service.createRequest({
        userId,
        userData,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });
      onRequestSent();
    } catch (err) {
      setError('Failed to send request. Please try again.');
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
