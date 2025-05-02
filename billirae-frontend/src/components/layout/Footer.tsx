import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} Billirae | Timejet GmbH
            </p>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Startseite
            </Link>
            <Link to="/create-invoice" className="text-sm text-muted-foreground hover:text-foreground">
              Rechnung erstellen
            </Link>
            <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground">
              Profil
            </Link>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Datenschutz
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Impressum
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
