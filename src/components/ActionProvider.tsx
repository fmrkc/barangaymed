import { createChatBotMessage } from 'react-chatbot-kit';

const ActionProvider = (createChatBotMessage: any, setState: any, createClientMessage: any) => {
  const handleHello = () => {
    const message = createChatBotMessage('Hello! Nice to meet you.');
    setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const handleRegistration = () => {
    const message = createChatBotMessage(
      'To register, go to the registration page and fill out your details. You need to provide personal information and upload documents for verification.'
    );
    setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const handleMedicine = () => {
    const message = createChatBotMessage(
      'For medicine requests, log in as a verified resident and submit a request from the medicine request page. Admins will review and approve it.'
    );
    setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const handleTeleconsultation = () => {
    const message = createChatBotMessage(
      'Teleconsultation allows you to request a virtual consultation with a healthcare professional. Submit a request with your reason, and an admin will schedule it.'
    );
    setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const handleAnnouncements = () => {
    const message = createChatBotMessage(
      'Announcements are posted by admins for important updates. Check the announcements section in your dashboard.'
    );
    setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const handleDefault = () => {
    const message = createChatBotMessage(
      "I'm sorry, I didn't understand that. Try asking about registration, medicine requests, teleconsultation, or announcements."
    );
    setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  return {
    handleHello,
    handleRegistration,
    handleMedicine,
    handleTeleconsultation,
    handleAnnouncements,
    handleDefault,
  };
};

export default ActionProvider;
