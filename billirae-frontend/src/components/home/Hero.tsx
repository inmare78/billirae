import { Mic } from 'lucide-react';
import { Button } from '../ui/button';

export default function Hero() {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Billirae - Rechnungen einfach per Sprache erstellen
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Sprechen Sie Ihre Rechnungen einfach ein und lassen Sie Billirae den Rest erledigen. 
              Perfekt für Selbstständige, Therapeuten, Coaches und Handwerker.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button size="lg" className="gap-1">
              <Mic className="h-4 w-4" />
              Jetzt starten
            </Button>
            <Button size="lg" variant="outline">
              Mehr erfahren
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
