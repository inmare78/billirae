import { test, expect } from '@playwright/test';
import { logPageDebugInfo } from '../../src/utils/logPage';
import { logRequestDebugInfo } from '../../src/utils/logRequest';
import { 
  setupAllSupabaseMocks, 
  mockUsers, 
  mockResponses 
} from '../utils/supabaseMocks';

test.describe('Account Deletion', () => {
  test.beforeEach(async ({ page }) => {
    // Enable test mode with mock user
    await page.addInitScript(() => {
      localStorage.setItem('test_mode', 'true');
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          user: mockUsers.deleteUser
        }
      }));
    });
    
    // Setup all Supabase mocks
    await setupAllSupabaseMocks(page, {
      user: mockUsers.deleteUser,
      users: true
    });

    await logPageDebugInfo(page, 'Test mode enabled with mock user');
    
    await page.goto('http://localhost:5173/profile');
    await logPageDebugInfo(page, 'Navigated to profile page');
  });

  test('should show confirmation dialog when deleting account', async ({ page }) => {
    await logPageDebugInfo(page, 'Starting account deletion test', { 
      startTrace: true,
      takeScreenshot: true 
    });

    await page.waitForSelector('h1:has-text("Unternehmensprofil")');
    
    await page.getByRole('button', { name: 'Konto löschen' }).click();
    await logPageDebugInfo(page, 'Clicked delete account button');
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Sind Sie sicher, dass Sie Ihr Konto löschen möchten?')).toBeVisible();
    
    await logPageDebugInfo(page, 'Confirmation dialog displayed', { takeScreenshot: true });
    
    await expect(page.getByRole('button', { name: 'Abbrechen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Konto löschen' })).toBeVisible();
  });

  test('should cancel account deletion when clicking cancel', async ({ page }) => {
    await page.getByRole('button', { name: 'Konto löschen' }).click();
    await logPageDebugInfo(page, 'Clicked delete account button');
    
    await page.getByRole('button', { name: 'Abbrechen' }).click();
    await logPageDebugInfo(page, 'Clicked cancel button');
    
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    await expect(page.url()).toContain('/profile');
  });

  test('should delete account and redirect to home page', async ({ page }) => {
    // Override the default mocks for this specific test
    await page.route('**/rest/v1/users**', async (route) => {
      const method = route.request().method();
      
      if (method === 'DELETE') {
        if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
          console.log(`Account deletion - DELETE users table request`);
        }
        
        await route.fulfill(mockResponses.success);
        
        if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
          await logRequestDebugInfo(
            await route.fetch(),
            'Delete User Profile',
            { includeHeaders: true },
            'DELETE'
          );
        }
      } else {
        // Pass through to default mock
        await route.fallback();
      }
    });
    
    await page.route('**/auth/v1/admin/users/**', async (route) => {
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        console.log(`Account deletion request: ${route.request().url()}`);
      }
      
      await route.fulfill(mockResponses.success);
      
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        await logRequestDebugInfo(
          await route.fetch(),
          'Delete Auth User',
          { includeHeaders: true },
          'DELETE'
        );
      }
    });
    
    // Create a request spy
    let deleteRequestMade = false;
    page.on('request', request => {
      if (request.url().includes('/gdpr/delete-account')) {
        deleteRequestMade = true;
      }
    });

    await page.getByRole('button', { name: 'Konto löschen' }).click();
    await logPageDebugInfo(page, 'Clicked delete account button');
    
    await page.getByRole('button', { name: /Konto löschen/ }).click();
    await logPageDebugInfo(page, 'Clicked confirm delete button');
    
    // Wait for redirect
    await page.waitForURL('http://localhost:5173/');
    await expect(page.url()).toBe('http://localhost:5173/');
    
    // Verify the delete request was made
    expect(deleteRequestMade).toBe(true);
    
    await logPageDebugInfo(page, 'Redirected to home page after account deletion', { 
      takeScreenshot: true,
      stopTrace: true 
    });
    
    // Try to login with deleted user
    await page.goto('http://localhost:5173/login');
    
    // Override auth mock for this specific test
    await page.route('**/auth/v1/token**', async (route) => {
      const requestData = await route.request().postDataJSON();
      
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        console.log(`Login attempt with deleted user: ${JSON.stringify(requestData)}`);
      }
      
      await route.fulfill(mockResponses.unauthorized);
    });
    
    await page.getByLabel('E-Mail').fill(mockUsers.deleteUser.email);
    await page.getByLabel('Passwort').fill('password123');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    
    await expect(page.getByText('Ungültige Anmeldedaten')).toBeVisible();
    
    await logPageDebugInfo(page, 'Login failed for deleted user as expected', { 
      takeScreenshot: true 
    });
  });
});
