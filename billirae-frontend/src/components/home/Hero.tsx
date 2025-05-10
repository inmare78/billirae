import React from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <div className="py-12 md:py-24 lg:py-32 flex flex-col items-center text-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-4">
        Billirae
      </h1>
      <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-[800px]">
        Die sprachgesteuerte Rechnungslösung für Selbstständige und Kleinunternehmer
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg">
          <Link to="/create-invoice">Rechnung erstellen</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/register">Konto erstellen</Link>
        </Button>
      </div>
      
      <div className="mt-16 relative w-full max-w-3xl mx-auto">
        <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
          <div className="text-center p-8">
            <h3 className="text-xl font-medium mb-2">Einfach. Schnell. Professionell.</h3>
            <p className="text-muted-foreground">
              Sprechen Sie Ihre Rechnung ein und lassen Sie Billirae den Rest erledigen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
