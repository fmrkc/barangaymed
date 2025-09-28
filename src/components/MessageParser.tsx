import React from 'react';

class MessageParser {
  actionProvider: any;
  state: any;

  constructor(actionProvider: any, state: any) {
    this.actionProvider = actionProvider;
    this.state = state;
  }

  parse(message: string) {
    const lowerCaseMessage = message.toLowerCase();

    if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi')) {
      this.actionProvider.handleHello();
    } else if (lowerCaseMessage.includes('registration') || lowerCaseMessage.includes('register')) {
      this.actionProvider.handleRegistration();
    } else if (lowerCaseMessage.includes('medicine') || lowerCaseMessage.includes('request')) {
      this.actionProvider.handleMedicine();
    } else if (lowerCaseMessage.includes('teleconsultation') || lowerCaseMessage.includes('tele')) {
      this.actionProvider.handleTeleconsultation();
    } else if (lowerCaseMessage.includes('announcement')) {
      this.actionProvider.handleAnnouncements();
    } else {
      this.actionProvider.handleDefault();
    }
  }
}

export default MessageParser;
