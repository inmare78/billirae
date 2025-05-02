import { FileText, Mail, Mic, Moon, BarChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export default function Features() {
  return (
    <div className="bg-muted/50 py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Funktionen</h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Alles was Sie für die einfache Rechnungsstellung benötigen
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
          <Card className="flex flex-col items-center text-center">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Spracheingabe</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sprechen Sie Ihre Rechnung einfach ein und Billirae erstellt automatisch eine strukturierte Rechnung.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="flex flex-col items-center text-center">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>PDF-Generierung</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Erstellen Sie professionelle PDF-Rechnungen mit Ihrem Branding und allen rechtlichen Anforderungen.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="flex flex-col items-center text-center">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>E-Mail-Versand</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Senden Sie Rechnungen direkt per E-Mail an Ihre Kunden, ohne die App zu verlassen.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="flex flex-col items-center text-center">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Umsatzübersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Behalten Sie den Überblick über Ihre monatlichen und jährlichen Einnahmen mit übersichtlichen Diagrammen.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="flex flex-col items-center text-center">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Moon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Dark Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Wechseln Sie zwischen hellem und dunklem Design, je nach Ihren Vorlieben und Umgebungsbedingungen.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="flex flex-col items-center text-center">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>DSGVO-konform</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Exportieren und löschen Sie Ihre Daten jederzeit gemäß den DSGVO-Anforderungen.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
