import React from 'react';
import { IonButton, IonList, IonItem, IonLabel, IonText, IonGrid, IonRow, IonCol } from '@ionic/react';

interface Page5Props {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  address: string;
  contactNumber: string;
  email: string;
  password: string;
  barangay: string;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}

const Page5: React.FC<Page5Props> = ({
  firstName,
  middleName,
  lastName,
  suffix,
  address,
  contactNumber,
  email,
  barangay,
  onBack,
  onSubmit,
  loading,
  error
}) => {
  return (
    <>
      <IonText>Step 5: Review all of your information before submitting.</IonText>
      <IonList className="ion-margin-top">
        <IonItem>
          <IonLabel>First Name</IonLabel>
          <IonText>{firstName}</IonText>
        </IonItem>
        <IonItem>
          <IonLabel>Middle Name</IonLabel>
          <IonText>{middleName}</IonText>
        </IonItem>
        <IonItem>
          <IonLabel>Last Name</IonLabel>
          <IonText>{lastName}</IonText>
        </IonItem>
        <IonItem>
          <IonLabel>Suffix</IonLabel>
          <IonText>{suffix || '-'}</IonText>
        </IonItem>
        <IonItem>
          <IonLabel>Address</IonLabel>
          <IonText>{address}</IonText>
        </IonItem>
        <IonItem>
          <IonLabel>Contact Number</IonLabel>
          <IonText>{contactNumber}</IonText>
        </IonItem>
        <IonItem>
          <IonLabel>Barangay</IonLabel>
          <IonText>{barangay}</IonText>
        </IonItem>
        <IonItem>
          <IonLabel>Email</IonLabel>
          <IonText>{email}</IonText>
        </IonItem>
        <IonItem>
          <IonLabel>Password</IonLabel>
          <IonText>********</IonText>
        </IonItem>
      </IonList>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <IonGrid>
        <IonRow className="ion-justify-content-between ion-margin-top">
          <IonCol size="5">
            <IonButton expand="block" onClick={onBack} disabled={loading}>Back</IonButton>
          </IonCol>
          <IonCol size="5">
            <IonButton expand="block" onClick={onSubmit} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </IonButton>
          </IonCol>
        </IonRow>
      </IonGrid>
    </>
  );
};

export default Page5;
