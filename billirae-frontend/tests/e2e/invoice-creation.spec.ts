import { test, expect } from '@playwright/test';
import { logPageDebugInfo } from '../../src/utils/logPage';

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

// const mockEmailData = {
//   recipient_email: "kunde@beispiel.de",
//   subject: "Rechnung: Massage",
//   message: "Sehr geehrte(r) Max Mustermann,\n\nanbei erhalten Sie Ihre Rechnung für Massage.\n\nMit freundlichen Grüßen"
// };

test.describe('Invoice Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Enable test mode
    await page.addInitScript(() => {
      localStorage.setItem('test_mode', 'true');
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
    await logPageDebugInfo(page, 'Invoice creation page loaded');
  });
  
  test('should create an invoice via voice input', async ({ page }) => {
    try {
      await logPageDebugInfo(page, 'Before starting voice input test', { takeScreenshot: true });
      
      // Verify the example text is visible (which is always present)
      await expect(page.getByText('Beispiel: "Drei Massagen à 80 Euro für Max Mustermann', { exact: false })).toBeVisible();
      await logPageDebugInfo(page, 'Example text is visible');
      
      // Click the "Aufnehmen" button to start voice recognition
      await page.getByRole('button', { name: 'Aufnehmen' }).click();
      await logPageDebugInfo(page, 'Clicked record button');
      
      // Wait for processing to complete
      await page.waitForTimeout(3000);
      
      await logPageDebugInfo(page, 'After voice processing', { 
        takeScreenshot: true,
        startTrace: true
      });
      
      // Wait for the recognized data to appear (with a longer timeout)
      try {
        await expect(page.getByText('Kunde: Max Mustermann', { exact: false })).toBeVisible({ timeout: 10000 });
        
        // Verify other invoice data is displayed correctly
        await expect(page.getByText(`Leistung: ${mockInvoiceData.service}`, { exact: false })).toBeVisible();
        await expect(page.getByText(`Menge: ${mockInvoiceData.quantity}`, { exact: false })).toBeVisible();
        
        await logPageDebugInfo(page, 'Invoice data displayed successfully', { 
          takeScreenshot: true,
          stopTrace: true
        });
      } catch (error) {
        await logPageDebugInfo(page, 'Failed to display invoice data', { 
          takeScreenshot: true,
          stopTrace: true
        });
        throw error;
      }
    } catch (error) {
      await logPageDebugInfo(page, 'Voice input test failed', { 
        takeScreenshot: true,
        stopTrace: true
      });
      throw error;
    }
  });
});
