import React from 'react';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';

const HomePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4">
      <Hero />
      <Features />
    </div>
  );
};

export default HomePage;
