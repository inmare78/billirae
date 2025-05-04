import { test, expect, Page } from '@playwright/test';

const mockTranscript = "Drei Massagen à 80 Euro für Max Mustermann, heute, inklusive Mehrwertsteuer.";
const mockInvoiceData = {
  client: "Max Mustermann",
  service: "Massage",
  quantity: 3,
  unit_price: 80,
  tax_rate: 0.2,
  invoice_date: new Date().toISOString().split('T')[0],
  currency: "EUR",
  language: "de"
};

const mockEmailData = {
  recipient_email: "kunde@beispiel.de",
  subject: "Rechnung: Massage",
  message: "Sehr geehrte(r) Max Mustermann,\n\nanbei erhalten Sie Ihre Rechnung für Massage.\n\nMit freundlichen Grüßen"
};

test.describe('Invoice Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      class MockSpeechRecognition extends EventTarget {
        continuous = false;
        interimResults = false;
        lang = 'de-DE';
        maxAlternatives = 1;
        
        constructor() {
          super();
          setTimeout(() => {
            const event = new CustomEvent('result');
            
            Object.defineProperty(event, 'results', { 
              value: [
                [{ 
                  transcript: mockTranscript,
                  confidence: 0.9 
                }]
              ],
              writable: false 
            });
            
            this.dispatchEvent(event);
            
            setTimeout(() => {
              this.dispatchEvent(new Event('end'));
            }, 500);
          }, 1000);
        }
        
        start() {
          this.dispatchEvent(new Event('start'));
        }
        
        stop() {
          this.dispatchEvent(new Event('end'));
        }
        
        abort() {
          this.dispatchEvent(new Event('end'));
        }
      }
      
      window.SpeechRecognition = MockSpeechRecognition;
      window.webkitSpeechRecognition = MockSpeechRecognition;
    });
    
    await mockApiResponses(page);
    
    await page.goto('http://localhost:5173/create-invoice');
  });
  
  test('should create an invoice via voice, generate PDF, and send email', async ({ page }) => {
    await page.getByRole('button', { name: 'Aufnehmen' }).click();
    
    await expect(page.getByText('Verarbeite Sprachaufnahme...')).toBeVisible();
    await expect(page.getByText('Erkannte Rechnungsdaten:')).toBeVisible({ timeout: 5000 });
    
    await expect(page.getByText(`Kunde: ${mockInvoiceData.client}`)).toBeVisible();
    await expect(page.getByText(`Leistung: ${mockInvoiceData.service}`)).toBeVisible();
    await expect(page.getByText(`Menge: ${mockInvoiceData.quantity}`)).toBeVisible();
    
    await page.getByRole('button', { name: 'Rechnung erstellen' }).click();
    
    await expect(page.getByText('Rechnung erfolgreich erstellt!')).toBeVisible({ timeout: 5000 });
    
    await page.getByRole('button', { name: 'PDF generieren' }).click();
    
    await expect(page.locator('iframe[title="Rechnungs-PDF"]')).toBeVisible({ timeout: 5000 });
    
    await page.getByRole('button', { name: 'Per E-Mail senden' }).click();
    
    await page.getByLabel('E-Mail-Adresse des Empfängers').fill(mockEmailData.recipient_email);
    await page.getByLabel('Betreff').fill(mockEmailData.subject);
    await page.locator('#email-message').fill(mockEmailData.message);
    
    await page.getByRole('button', { name: 'E-Mail senden' }).click();
    
    await expect(page.getByText('E-Mail erfolgreich gesendet!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(`Die Rechnung wurde an ${mockEmailData.recipient_email} gesendet.`)).toBeVisible();
  });
});

/**
 * Mock API responses for the test
 */
async function mockApiResponses(page: Page) {
  await page.route('**/api/voice/parse', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockInvoiceData)
    });
  });
  
  await page.route('**/api/invoices', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-invoice-id-123',
          ...mockInvoiceData,
          created_at: new Date().toISOString()
        })
      });
    }
  });
  
  await page.route('**/api/invoices/*/pdf', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        pdf_url: '/mock-invoice.pdf',
        success: true
      })
    });
  });
  
  await page.route('**/mock-invoice.pdf', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/pdf',
      body: Buffer.from('Mock PDF content')
    });
  });
  
  await page.route('**/api/invoices/*/email', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully'
      })
    });
  });
}
