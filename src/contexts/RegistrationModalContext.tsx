import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RegistrationModalContextType {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const RegistrationModalContext = createContext<RegistrationModalContextType | undefined>(undefined);

export const RegistrationModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <RegistrationModalContext.Provider value={{ isModalOpen, openModal, closeModal }}>
      {children}
    </RegistrationModalContext.Provider>
  );
};

export const useRegistrationModal = () => {
  const context = useContext(RegistrationModalContext);
  if (context === undefined) {
    throw new Error('useRegistrationModal must be used within a RegistrationModalProvider');
  }
  return context;
};
