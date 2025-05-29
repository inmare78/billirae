import { test, expect } from '@playwright/test';
import { logPageDebugInfo } from '../../src/utils/logPage';
import { logRequestDebugInfo } from '../../src/utils/logRequest';
import { 
  setupAllSupabaseMocks, 
  mockUsers, 
  mockProfiles, 
  mockResponses 
} from '../utils/supabaseMocks';

test.describe('User Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // Enable test mode
    await page.addInitScript(() => {
      localStorage.setItem('test_mode', 'true');
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          user: mockUsers.testUser
        }
      }));
    });
    
    // Setup all Supabase mocks
    await setupAllSupabaseMocks(page, {
      users: true,
      invoices: true,
      customers: true
    });
    
    // Navigate to profile page
    await page.goto('http://localhost:5173/profile');
    await logPageDebugInfo(page, 'profile-page-loaded');
  });
  
  test('should load and display profile form', async ({ page }) => {
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
    // Override the default mock to simulate a server error
    await page.route('**/rest/v1/users**', async (route) => {
      const method = route.request().method();
      
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify(mockProfiles.testProfile)
        });
      } else if (method === 'PATCH' || method === 'POST') {
        const response = await route.fetch();
        
        // Log the failed request if logging is enabled
        if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
          await logRequestDebugInfo(response, 'profile-update-failed-response', {
            includeHeaders: true,
            maxBodyLength: 2000
          }, method);
        }
        
        await route.fulfill(mockResponses.serverError);
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
    // Setup mocks with User A instead of test user
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
    
    // Override the default mock to test security
    await page.route('**/rest/v1/users**', async (route) => {
      const method = route.request().method();
      
      if (method === 'GET') {
        // Return user A's profile data
        await route.fulfill({
          status: 200,
          body: JSON.stringify(mockProfiles.profileA)
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
          
          await route.fulfill(mockResponses.forbidden);
        } else {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              ...mockProfiles.profileA,
              first_name: 'Updated',
              last_name: 'User A',
              company_name: 'Updated Company A',
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
    
    // Take a screenshot showing the error message
    await page.screenshot({ path: 'test-results/security-test-permission-denied.png' });
    
    // Restore the original fetch function
    await page.evaluate(() => {
      window.fetch = (window as any).originalFetchStored;
    });
  });
});
