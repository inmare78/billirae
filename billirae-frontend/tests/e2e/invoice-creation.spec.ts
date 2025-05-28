import { test, expect } from '@playwright/test';

// Mock data for testing - these values should match what's returned by the VoiceInput component in test mode
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
    // Enable test mode
    await page.addInitScript(() => {
      localStorage.setItem('test_mode', 'true');
      console.log('Test mode enabled via localStorage');
    });
    
    await page.route('**/mock-invoice.pdf', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('Mock PDF content')
      });
    });
    
    // Navigate to the create invoice page
    await page.goto('/create-invoice');
  });
  
  test('should create an invoice via voice input', async ({ page }) => {
    await page.screenshot({ path: 'test-results/before-voice-input.png' });
    
    // Verify the example text is visible (which is always present)
    await expect(page.getByText('Beispiel: "Drei Massagen à 80 Euro für Max Mustermann', { exact: false })).toBeVisible();
    
    // Click the "Aufnehmen" button to start voice recognition
    await page.getByRole('button', { name: 'Aufnehmen' }).click();
    
    // Wait for processing to complete (use a longer timeout)
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/after-voice-processing.png' });
    
    console.log('Page content after clicking "Aufnehmen":', await page.content());
    
    
    // Wait for the recognized data to appear (with a longer timeout)
    await expect(page.getByText('Kunde: Max Mustermann', { exact: false })).toBeVisible({ timeout: 10000 });
    
    // Verify other invoice data is displayed correctly
    await expect(page.getByText(`Leistung: ${mockInvoiceData.service}`, { exact: false })).toBeVisible();
    await expect(page.getByText(`Menge: ${mockInvoiceData.quantity}`, { exact: false })).toBeVisible();
    
    console.log('Test passed: Voice input component successfully displays invoice data');
  });
});
