import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background py-6">
      <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
        <p className="text-center text-sm text-muted-foreground md:text-left">
          &copy; {currentYear} Billirae - Timejet GmbH. Alle Rechte vorbehalten.
        </p>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <a href="/datenschutz" className="hover:underline">Datenschutz</a>
          <a href="/impressum" className="hover:underline">Impressum</a>
          <a href="/agb" className="hover:underline">AGB</a>
        </nav>
      </div>
    </footer>
  );
}
