import { test, expect } from '@playwright/test';
import { logPageDebugInfo } from '../../src/utils/logPage';

test.describe('User Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // Enable test mode
    await page.addInitScript(() => {
      localStorage.setItem('test_mode', 'true');
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: { name: 'Test User' }
          }
        }
      }));
    });
    
    // Navigate to profile page
    await page.goto('http://localhost:5173/profile');
  });
  
  test('should load and display profile form', async ({ page }) => {
    // Log page state if enabled
    await logPageDebugInfo(page, 'profile-page-loaded');
    
    // Check that the profile form is displayed
    await expect(page.getByText('Unternehmensprofil')).toBeVisible();
    await expect(page.getByText('Persönliche Daten')).toBeVisible();
    await expect(page.getByText('Unternehmensdaten')).toBeVisible();
    await expect(page.getByText('Adresse')).toBeVisible();
    await expect(page.getByText('Kontakt')).toBeVisible();
    await expect(page.getByText('Bankverbindung')).toBeVisible();
    
    // Check that form fields are present
    await expect(page.getByLabel('Vorname')).toBeVisible();
    await expect(page.getByLabel('Nachname')).toBeVisible();
    await expect(page.getByLabel('Firmenname')).toBeVisible();
    await expect(page.getByLabel('Steuernummer')).toBeVisible();
    await expect(page.getByLabel('E-Mail')).toBeVisible();
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/profile-form.png' });
  });
  
  test('should update profile data', async ({ page }) => {
    // Mock the Supabase response for profile update
    await page.route('**/rest/v1/users**', async (route) => {
      const method = route.request().method();
      
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'test-profile-id',
            user_id: 'test-user-id',
            first_name: 'Max',
            last_name: 'Mustermann',
            company_name: 'Test GmbH',
            tax_id: 'DE123456789',
            website_url: 'https://example.com',
            street_1: 'Teststraße',
            street_2: '',
            house_number: '123',
            zip: '12345',
            city: 'Berlin',
            state: 'Berlin',
            country: 'Deutschland',
            country_code: 'DE',
            email: 'test@example.com',
            phone: '+49123456789',
            bank_name: 'Test Bank',
            bank_iban: 'DE89370400440532013000',
            bank_bic: 'TESTDEFF'
          })
        });
      } else if (method === 'PATCH' || method === 'POST') {
        // Log the request data if enabled
        if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
          console.log(`Profile update request: ${JSON.stringify(await route.request().postDataJSON())}`);
        }
        
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'test-profile-id',
            user_id: 'test-user-id',
            first_name: 'Max',
            last_name: 'Mustermann',
            company_name: 'Updated GmbH',
            tax_id: 'DE123456789',
            website_url: 'https://example.com',
            street_1: 'Teststraße',
            street_2: '',
            house_number: '123',
            zip: '12345',
            city: 'Berlin',
            state: 'Berlin',
            country: 'Deutschland',
            country_code: 'DE',
            email: 'test@example.com',
            phone: '+49123456789',
            bank_name: 'Test Bank',
            bank_iban: 'DE89370400440532013000',
            bank_bic: 'TESTDEFF',
            updated_at: new Date().toISOString()
          })
        });
      }
    });
    
    // Wait for the profile form to load
    await page.waitForSelector('form');
    
    // Update the company name
    await page.getByLabel('Firmenname').fill('Updated GmbH');
    
    // Submit the form
    await page.getByRole('button', { name: 'Speichern' }).click();
    
    // Log page state after update if enabled
    await logPageDebugInfo(page, 'profile-update-submitted');
    
    // Check for success message
    await expect(page.getByText('Profil erfolgreich aktualisiert')).toBeVisible();
    
    // Take a screenshot after update
    await page.screenshot({ path: 'test-results/profile-updated.png' });
  });
  
  test('should handle account deletion confirmation', async ({ page }) => {
    // Mock the Supabase response for account deletion
    await page.route('**/rest/v1/users**', async (route) => {
      await route.fulfill({ status: 200, body: '{}' });
    });
    
    await page.route('**/auth/v1/admin/users/**', async (route) => {
      // Log the request data if enabled
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        console.log(`Account deletion request: ${route.request().url()}`);
      }
      
      await route.fulfill({ status: 200, body: '{}' });
    });
    
    // Click the delete account button
    await page.getByRole('button', { name: 'Konto löschen' }).click();
    
    // Check that the confirmation dialog is displayed
    await expect(page.getByText('Sind Sie sicher, dass Sie Ihr Konto löschen möchten?')).toBeVisible();
    
    // Take a screenshot of the confirmation dialog
    await page.screenshot({ path: 'test-results/delete-account-dialog.png' });
    
    // Click the cancel button to dismiss the dialog
    await page.getByRole('button', { name: 'Abbrechen' }).click();
    
    // Check that the dialog is closed
    await expect(page.getByText('Sind Sie sicher, dass Sie Ihr Konto löschen möchten?')).not.toBeVisible();
  });
  
  test('should export user data (GDPR)', async ({ page }) => {
    // Mock the Supabase responses for data export
    await page.route('**/rest/v1/users**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'test-profile-id',
          user_id: 'test-user-id',
          first_name: 'Max',
          last_name: 'Mustermann',
          company_name: 'Test GmbH',
          // ... other profile fields
        })
      });
    });
    
    await page.route('**/rest/v1/invoices**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            id: 'invoice-1',
            user_id: 'test-user-id',
            client_id: 'client-1',
            date: '2025-05-01',
            inv_number: 'INV-001'
          }
        ])
      });
    });
    
    await page.route('**/rest/v1/customers**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            id: 'client-1',
            user_id: 'test-user-id',
            customer_id: 'CUST-001',
            company_name: 'Client GmbH'
          }
        ])
      });
    });
    
    // Create a download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click the export data button
    await page.getByRole('button', { name: 'Daten exportieren (GDPR)' }).click();
    
    // Wait for the download to start
    const download = await downloadPromise;
    
    // Verify the download started
    expect(download.suggestedFilename()).toContain('billirae-user-data-');
    
    // Log the export action if enabled
    await logPageDebugInfo(page, 'gdpr-export-completed');
  });
});
