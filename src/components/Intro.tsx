import { IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonPage, IonText, IonTitle, IonToolbar } from '@ionic/react';
import React from 'react';
import {Swiper, SwiperSlide, useSwiper} from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import Intropng from '../assets/TV - 1.png';
import 'swiper/css';
import './Intro.css';
import { arrowForward } from 'ionicons/icons';



interface ContainerProps {
    onFinish: () => void;
}

const SwiperButtonNext = ({ children }:any) => {
    const swiper = useSwiper();
    return <IonButton onClick={() => swiper.slideNext()}>{children}</IonButton>;
};

const Intro: React.FC<ContainerProps> = ({ onFinish }) => {
    return (
        <div className="intro-container">
        <IonHeader className='ion-no-border'>
            <IonToolbar className='ion-text-center'>
                <IonText color='primary'><b>BarangayMed+</b></IonText>
            </IonToolbar>
        </IonHeader>
           <Swiper
               modules={[Autoplay]}
               autoplay={{ delay: 3000, disableOnInteraction: false }}
               loop={true}
               className="swiper"
           >
            <SwiperSlide>
                
               
                <h2>Request medicines <br /> <IonText color={'primary'}> <b>straight from your phone.</b></IonText></h2>

               
            </SwiperSlide>
        <SwiperSlide>
           
            <h2>Book appointments <br /> <IonText color={'primary'}><b>in only a few taps.</b></IonText></h2>
           
            
        </SwiperSlide>
        <SwiperSlide>
            
            <h2>Access barangay announcements <br /> <IonText color={'primary'}><b>in real time.</b></IonText></h2>
           
           
        </SwiperSlide>
        <SwiperSlide>
           
            <h1><IonText color={'primary'}>BarangayMed+</IonText> </h1>
            <h2>Get access to medicine, book appointments, and see real-time barangay announcements <br /> <IonText color={'primary'}><b>all in one app!</b></IonText> </h2>
            
            </SwiperSlide>
       </Swiper>
            <IonFooter>
                <IonToolbar>
                    <IonButton
                    shape='round'
                    expand='block'
                    className='ion-padding-vertical'
                    onClick={() => onFinish()}
                    >
                       <IonText color={'light'}> <b>Get Started</b> </IonText>
                       <IonIcon slot='end' icon={arrowForward} color='light' />
                    </IonButton>
                </IonToolbar>
            </IonFooter>
        </div>
     
    );
};

export default Intro; 