import React, { useState } from 'react';
import { Menu, X, Moon, Sun, Mic } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useTheme } from '../../lib/theme-provider';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '../ui/navigation-menu';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menü öffnen</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                <a href="/" className="flex items-center gap-2 text-lg font-semibold">
                  <Mic className="h-5 w-5" />
                  <span>Billirae</span>
                </a>
                <a href="/dashboard" className="text-sm font-medium hover:underline">Dashboard</a>
                <a href="/invoices" className="text-sm font-medium hover:underline">Rechnungen</a>
                <a href="/clients" className="text-sm font-medium hover:underline">Kunden</a>
                <a href="/settings" className="text-sm font-medium hover:underline">Einstellungen</a>
                <div className="flex flex-col gap-2 mt-4">
                  <a href="/login" className="text-sm font-medium hover:underline">Anmelden</a>
                  <a href="/register" className="text-sm font-medium hover:underline">Registrieren</a>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <a href="/" className="flex items-center gap-2 text-lg font-semibold">
            <Mic className="h-5 w-5" />
            <span>Billirae</span>
          </a>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink href="/dashboard" className="text-sm font-medium hover:underline">
                  Dashboard
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium">Rechnungen</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-4 w-[200px]">
                    <NavigationMenuLink href="/invoices" className="text-sm font-medium hover:underline">
                      Alle Rechnungen
                    </NavigationMenuLink>
                    <NavigationMenuLink href="/invoices/new" className="text-sm font-medium hover:underline">
                      Neue Rechnung
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="/clients" className="text-sm font-medium hover:underline">
                  Kunden
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="/settings" className="text-sm font-medium hover:underline">
                  Einstellungen
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Farbmodus umschalten"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <div className="hidden md:flex items-center gap-2">
            <a href="/login">
              <Button variant="ghost" size="sm">Anmelden</Button>
            </a>
            <a href="/register">
              <Button size="sm">Registrieren</Button>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
