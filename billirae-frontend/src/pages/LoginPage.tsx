import React from 'react';
import LoginForm from '../components/forms/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <LoginForm />
    </div>
  );
};

export default LoginPage;
