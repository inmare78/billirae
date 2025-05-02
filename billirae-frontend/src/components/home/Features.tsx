import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

const features = [
  {
    title: 'Spracherkennung',
    description: 'Sprechen Sie Ihre Rechnungsdetails ein und lassen Sie Billirae den Rest erledigen.',
    icon: '🎤',
  },
  {
    title: 'KI-Verarbeitung',
    description: 'Unsere KI extrahiert automatisch alle relevanten Informationen aus Ihrer Spracheingabe.',
    icon: '🧠',
  },
  {
    title: 'PDF-Generierung',
    description: 'Erstellen Sie professionelle Rechnungen im PDF-Format mit nur wenigen Klicks.',
    icon: '📄',
  },
  {
    title: 'E-Mail-Versand',
    description: 'Senden Sie Ihre Rechnungen direkt aus der App per E-Mail an Ihre Kunden.',
    icon: '📧',
  },
  {
    title: 'Rechnungsarchiv',
    description: 'Behalten Sie den Überblick über alle Ihre Rechnungen und Einnahmen.',
    icon: '📚',
  },
  {
    title: 'DSGVO-konform',
    description: 'Alle Ihre Daten werden sicher und DSGVO-konform gespeichert und verarbeitet.',
    icon: '🔒',
  },
];

const Features: React.FC = () => {
  return (
    <div className="py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Funktionen
          </h2>
          <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground">
            Billirae bietet alles, was Sie für die einfache Rechnungsstellung benötigen.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardHeader>
                <div className="text-4xl mb-2">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
