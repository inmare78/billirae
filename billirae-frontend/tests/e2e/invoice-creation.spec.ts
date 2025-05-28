import { test, expect } from '@playwright/test';
import { logPageDebugInfo } from '../../src/utils/logPage';
import { logRequestDebugInfo } from '../../src/utils/logRequest';

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
    await logPageDebugInfo(page, 'Test mode enabled via localStorage');
    
    await page.route('**/mock-invoice.pdf', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('Mock PDF content')
      });
    });
    
    // Navigate to the create invoice page
    await page.goto('http://localhost:5173/create-invoice');
    await logPageDebugInfo(page, 'Navigated to create invoice page');
  });
  
  test('should create an invoice via voice input', async ({ page }) => {
    try {
      await logPageDebugInfo(page, 'Starting voice input test', { takeScreenshot: true });
      
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
  
  test('should log API request when creating an invoice', async ({ page }) => {
    await logPageDebugInfo(page, 'Starting invoice creation API test');
    
    await page.getByLabel('Kunde').fill(mockInvoiceData.client);
    await page.getByLabel('Leistung').fill(mockInvoiceData.service);
    await page.getByLabel('Menge').fill(mockInvoiceData.quantity.toString());
    await page.getByLabel('Preis pro Einheit').fill(mockInvoiceData.unit_price.toString());
    
    await logPageDebugInfo(page, 'Invoice form filled', { takeScreenshot: true });
    
    // Wait for the invoice creation API request
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/invoices') && 
      response.request().method() === 'POST'
    );
    
    const startTime = Date.now();
    
    // Click the create invoice button
    await page.getByRole('button', { name: 'Rechnung erstellen' }).click();
    await logPageDebugInfo(page, 'Clicked create invoice button');
    
    try {
      // Wait for the API response
      const response = await responsePromise;
      
      await logRequestDebugInfo(
        response as any, // Type assertion to handle Response vs APIResponse
        'Invoice Creation API', 
        { startTime, maxBodyLength: 1000 },
        'POST'
      );
      
      // Verify the response status
      expect(response.status()).toBe(201);
      
      // Verify the response contains expected data
      const responseData = await response.json();
      expect(responseData).toHaveProperty('id');
      expect(responseData).toHaveProperty('invoice_number');
      
      await logPageDebugInfo(page, 'Invoice created successfully', { takeScreenshot: true });
      
      await page.waitForURL('**/invoices/*');
      await expect(page.getByText('Rechnung erfolgreich erstellt')).toBeVisible();
      
      // Verify invoice details are displayed
      await expect(page.getByText(mockInvoiceData.client)).toBeVisible();
      await expect(page.getByText(mockInvoiceData.service)).toBeVisible();
      
      await logPageDebugInfo(page, 'Invoice details displayed in UI', { takeScreenshot: true });
      
    } catch (error) {
      await logPageDebugInfo(page, `Invoice creation API error: ${error}`, { 
        takeScreenshot: true,
        startTrace: true,
        stopTrace: true
      });
      
      const errorResponse = await page.waitForResponse(response => 
        response.url().includes('/invoices') && 
        response.status() >= 400
      );
      
      await logRequestDebugInfo(
        errorResponse as any,
        'Invoice Creation Error Response',
        { maxBodyLength: 2000 },
        'POST'
      );
      
      throw error;
    }
  });
});
