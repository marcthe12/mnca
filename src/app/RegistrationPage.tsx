import React from 'react';
import RegistrationForm from '../components/RegistrationForm'; // Adjust the path if needed
import { Header } from '../components/Header';

const RegistrationPage: React.FC = () => {
  return (
    <>
      <Header />
      <RegistrationForm />
    </>
  );
};

export default RegistrationPage;
