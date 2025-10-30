import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React, { useState } from 'react';

const SARegisterResident: React.FC = () => {
    const [step, setStep] = useState(1);

    const nextPage = () => setStep(prev => prev + 1);
    const prevPage = () => setStep(prev => prev - 1);

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        {/* Page 1 content will go here */}
                        <IonButton onClick={nextPage}>NEXT</IonButton>
                    </>
                );
            case 2:
                return (
                    <>
                        {/* Page 2 content will go here */}
                        <IonButton onClick={prevPage}>BACK</IonButton>
                        <IonButton onClick={nextPage}>NEXT</IonButton>
                    </>
                );
            case 3:
                return (
                    <>
                        {/* Page 3 content will go here */}
                        <IonButton onClick={prevPage}>BACK</IonButton>
                        <IonButton>SUBMIT REGISTRATION</IonButton>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Register New Resident - Step {step}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                {renderStep()}
            </IonContent>
        </IonPage>
    );
};

export default SARegisterResident;
