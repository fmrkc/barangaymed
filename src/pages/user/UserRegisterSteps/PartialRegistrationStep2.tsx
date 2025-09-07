import React, { useState } from 'react';
import { IonButton, IonInput, IonRow, IonCol, IonText, IonCardSubtitle, IonCardTitle, IonIcon } from '@ionic/react';
import { arrowBack, arrowForward, lockClosed, mail, eye, eyeOff } from 'ionicons/icons';

interface Page4Props {
  email: string;
  password: string;
  confirmPassword?: string; // Make it optional to avoid breaking changes if not passed
  onChange: (field: string, value: string) => void;
  onNext?: () => void;
  onBack?: () => void;
  error: string | null;
}

const Page4: React.FC<Page4Props> = ({ email, password, confirmPassword, onChange, error }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
    <IonCardTitle className="ion-padding-vertical">
        Step 4: Enter your account details.
      </IonCardTitle>
      
      <div className="ion-margin-top">
        <IonCardSubtitle>Email *</IonCardSubtitle>
        <IonInput
          fill="outline"
          placeholder="juandelacruz@example.com"
          type="email"
          value={email}
          onIonChange={e => onChange('email', e.detail.value!)}
          className={`${!email.trim() && 'ion-invalid ion-touched'}`}
          errorText="Email is required"
        >
          <IonIcon slot="start" icon={mail}></IonIcon>
        </IonInput>
      </div>
      
      <div className="ion-margin-top">
        <IonCardSubtitle>Password *</IonCardSubtitle>
        <IonInput
          fill="outline"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onIonChange={e => onChange('password', e.detail.value!)}
          className={`${!password.trim() && 'ion-invalid ion-touched'}`}
          errorText="Password is required"
        >
          
          <IonIcon
            icon={showPassword ? eyeOff : eye}
            slot="end"
            onClick={() => setShowPassword(!showPassword)}
            style={{ cursor: "pointer" }}
          />
        </IonInput>
      </div>

      <div className='ion-margin-top'>
        <IonCardSubtitle>Confirm Password *</IonCardSubtitle>
        <IonInput
          fill="outline"
          type={showPassword ? "text" : "password"}
          placeholder="Re-enter your password"
          value={confirmPassword}
          onIonChange={e => onChange('confirmPassword', e.detail.value!)}
          className={`${!confirmPassword?.trim() && 'ion-invalid ion-touched'}`}
          errorText="Confirm password is required"
        >
          
          <IonIcon
            icon={showPassword ? eyeOff : eye}
            slot="end"
            onClick={() => setShowPassword(!showPassword)}
            style={{ cursor: "pointer" }}
          />
        </IonInput>
      </div>
     
      
    </>
  );
};

export default Page4;
