import React from 'react';
import RegisterForm from '../components/forms/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
