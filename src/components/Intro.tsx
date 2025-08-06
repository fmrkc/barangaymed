import { IonButton, IonContent, IonHeader, IonPage, IonText, IonTitle, IonToolbar } from '@ionic/react';
import React from 'react';
import {Swiper, SwiperSlide, useSwiper} from 'swiper/react';
import Intropng from '../assets/TV - 1.png';
import 'swiper/css';
import './Intro.css';


interface ContainerProps {
    onFinish: () => void;
}

const SwiperButtonNext = ({ children }:any) => {
    const swiper = useSwiper();
    return <IonButton onClick={() => swiper.slideNext()}>{children}</IonButton>;
};

const Intro: React.FC<ContainerProps> = ({ onFinish }) => {
    return (
       <Swiper>
        <SwiperSlide>
            <img src={Intropng} alt="intro" />
            <IonText>
                <h3>SLIDE1</h3>
            </IonText>
            <SwiperButtonNext>Next</SwiperButtonNext>
        </SwiperSlide>
        <SwiperSlide>
            {/* <img src={Intropng} alt="intro" /> */}
            <IonText>
                <h3>SLIDE2</h3>
            </IonText>
            <IonButton onClick={() => onFinish()}>Finish</IonButton>
        </SwiperSlide>
        
       </Swiper>
    );
};

export default Intro; 