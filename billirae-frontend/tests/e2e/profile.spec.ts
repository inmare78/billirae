import { test, expect } from '@playwright/test';
import { logPageDebugInfo } from '../../src/utils/logPage';
import { logRequestDebugInfo } from '../../src/utils/logRequest';

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
  
  test('should prevent saving profile with empty required fields', async ({ page }) => {
    // Mock the Supabase response for profile data
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
        if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
          console.log(`UNEXPECTED API CALL: Profile update request with empty required field`);
          console.log(`Request data: ${JSON.stringify(await route.request().postDataJSON())}`);
        }
        
        await route.fulfill({
          status: 400,
          body: JSON.stringify({
            error: 'Validation failed',
            message: 'Required fields cannot be empty'
          })
        });
      }
    });
    
    // Wait for the profile form to load
    await page.waitForSelector('form');
    
    // Log the initial state
    await logPageDebugInfo(page, 'profile-validation-test-start');
    
    await page.getByLabel('Vorname').fill('');
    
    // Take a screenshot of the form with empty field
    await page.screenshot({ path: 'test-results/profile-empty-required-field.png' });
    
    // Try to submit the form
    await page.getByRole('button', { name: 'Speichern' }).click();
    
    // Log the state after attempted submission
    await logPageDebugInfo(page, 'profile-validation-after-submit');
    
    await expect(page.getByText('Dieses Feld ist erforderlich')).toBeVisible();
    
    await expect(page).toHaveURL(/.*\/profile/);
    
    await expect(page.getByText('Profil erfolgreich aktualisiert')).not.toBeVisible();
    
    // Create a spy to verify no API requests were made
    let apiRequestMade = false;
    page.on('request', request => {
      if (request.url().includes('/rest/v1/users') && 
          (request.method() === 'PATCH' || request.method() === 'POST')) {
        apiRequestMade = true;
      }
    });
    
    await page.getByRole('button', { name: 'Speichern' }).click();
    
    await page.waitForTimeout(500);
    
    expect(apiRequestMade).toBe(false);
    
    // Take a final screenshot showing the validation error
    await page.screenshot({ path: 'test-results/profile-validation-error.png' });
  });
  
  test('should handle Supabase API failure during profile update', async ({ page }) => {
    // Create a mock for the API response
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
            phone: '+49123456789'
          })
        });
      } else if (method === 'PATCH' || method === 'POST') {
        const response = await route.fetch();
        const responseObj = {
          status: 500,
          body: JSON.stringify({
            error: 'Internal Server Error',
            message: 'Database connection failed'
          })
        };
        
        // Log the failed request if logging is enabled
        if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
          await logRequestDebugInfo(response, 'profile-update-failed-response', {
            includeHeaders: true,
            maxBodyLength: 2000
          }, method);
        }
        
        await route.fulfill(responseObj);
      }
    });
    
    // Wait for the profile form to load
    await page.waitForSelector('form');
    
    // Log the initial state
    await logPageDebugInfo(page, 'profile-api-failure-test-start');
    
    // Update a field in the form
    await page.getByLabel('Firmenname').fill('Updated Company Name');
    
    // Take a screenshot before submission
    await page.screenshot({ path: 'test-results/profile-before-api-error.png' });
    
    // Submit the form to trigger the API error
    await page.getByRole('button', { name: 'Speichern' }).click();
    
    // Log the state after the error
    await logPageDebugInfo(page, 'profile-after-api-error');
    
    await expect(page.getByRole('alert')).toBeVisible();
    
    // Assert that the error message from parseSupabaseError is displayed
    await expect(page.getByText('Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.')).toBeVisible();
    
    // Assert that we're still on the profile page
    await expect(page).toHaveURL(/.*\/profile/);
    
    await expect(page.getByText('Profil erfolgreich aktualisiert')).not.toBeVisible();
    
    // Take a screenshot showing the error message
    await page.screenshot({ path: 'test-results/profile-api-error.png' });
  });
  
  test('should enforce Row-Level Security and prevent updating another user profile', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('test_mode', 'true');
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          user: {
            id: 'user-a-id',
            email: 'user-a@example.com',
            user_metadata: { name: 'User A' }
          }
        }
      }));
    });
    
    // Mock the initial profile data fetch
    await page.route('**/rest/v1/users**', async (route) => {
      const method = route.request().method();
      
      if (method === 'GET') {
        // Return user A's profile data
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'profile-a-id',
            user_id: 'user-a-id',
            first_name: 'User',
            last_name: 'A',
            company_name: 'Company A',
            email: 'user-a@example.com'
          })
        });
      } else if (method === 'PATCH' || method === 'POST') {
        const requestData = await route.request().postDataJSON();
        
        // Log the request for debugging
        if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
          console.log(`Security test - Profile update request: ${JSON.stringify(requestData)}`);
        }
        
        if (requestData.user_id && requestData.user_id !== 'user-a-id') {
          // Log the security violation attempt
          if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
            await logRequestDebugInfo(await route.fetch(), 'security-violation-attempt', {
              includeHeaders: true,
              maxBodyLength: 2000
            }, method);
          }
          
          await route.fulfill({
            status: 403,
            body: JSON.stringify({
              error: 'Permission denied',
              message: 'Sie haben keine Berechtigung, dieses Profil zu aktualisieren.'
            })
          });
        } else {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              id: 'profile-a-id',
              user_id: 'user-a-id',
              first_name: 'Updated',
              last_name: 'User A',
              company_name: 'Updated Company A',
              email: 'user-a@example.com',
              updated_at: new Date().toISOString()
            })
          });
        }
      }
    });
    
    // Navigate to profile page
    await page.goto('http://localhost:5173/profile');
    
    // Wait for the profile form to load
    await page.waitForSelector('form');
    
    // Log the initial state
    await logPageDebugInfo(page, 'security-test-start');
    
    
    await page.getByLabel('Firmenname').fill('Hacked Company');
    
    // Then, use page.evaluate to inject a different user_id into the form submission
    await page.evaluate(() => {
      // Create a custom event that will be intercepted by our test
      const originalFetch = window.fetch;
      window.fetch = function(url, options) {
        if (typeof url === 'string' && url.includes('/rest/v1/users') && options && options.method && 
            (options.method === 'POST' || options.method === 'PATCH')) {
          const body = JSON.parse(options.body as string);
          body.user_id = 'user-b-id'; // Attempt to update a different user's profile
          options.body = JSON.stringify(body);
        }
        return originalFetch(url, options);
      };
      
      (window as any).originalFetchStored = originalFetch;
    });
    
    // Take a screenshot before submission
    await page.screenshot({ path: 'test-results/security-test-before-submit.png' });
    
    // Submit the form to trigger the security check
    await page.getByRole('button', { name: 'Speichern' }).click();
    
    // Log the state after the security violation attempt
    await logPageDebugInfo(page, 'security-test-after-submit');
    
    // Assert that an error alert is shown
    await expect(page.getByRole('alert')).toBeVisible();
    
    // Assert that the permission denied error message is displayed
    await expect(page.getByText('Sie haben keine Berechtigung für diese Aktion.')).toBeVisible();
    
    // Assert that we're still on the profile page
    await expect(page).toHaveURL(/.*\/profile/);
    
    // Assert that no success message is shown
    await expect(page.getByText('Profil erfolgreich aktualisiert')).not.toBeVisible();
    
    // Take a screenshot showing the security error message
    await page.screenshot({ path: 'test-results/security-test-error.png' });
    
    // Verify that a legitimate update for the correct user still works
    await page.evaluate(() => {
      window.fetch = (window as any).originalFetchStored;
    });
    
    // Update a field with a legitimate value
    await page.getByLabel('Firmenname').fill('Legitimate Company Update');
    
    // Submit the form again with the legitimate update
    await page.getByRole('button', { name: 'Speichern' }).click();
    
    // Assert that the success message is shown for the legitimate update
    await expect(page.getByText('Profil erfolgreich aktualisiert')).toBeVisible();
    
    // Take a screenshot showing the successful legitimate update
    await page.screenshot({ path: 'test-results/security-test-legitimate-update.png' });
  });
});
