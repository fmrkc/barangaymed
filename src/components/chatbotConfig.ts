import { createChatBotMessage } from 'react-chatbot-kit';

const config = {
  botName: 'BarangayMed Assistant',
  initialMessages: [
    createChatBotMessage("Hi! I'm the BarangayMed Assistant. How can I help you today?", {}),
    createChatBotMessage("You can ask me about registration, medicine requests, teleconsultation, or announcements.", {}),
  ],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#376B7E',
    },
    chatButton: {
      backgroundColor: '#376B7E',
    },
  },
};

export default config;
