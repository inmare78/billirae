import { test, expect } from '@playwright/test';
import { logPageDebugInfo } from '../../src/utils/logPage';
import { logRequestDebugInfo } from '../../src/utils/logRequest';

test.describe('Account Deletion', () => {
  const testUser = {
    email: 'deleteuser@example.com',
    password: 'Test123!',
    name: 'Delete User'
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('test_mode', 'true');
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          user: {
            id: 'test-user-id',
            email: 'deleteuser@example.com',
            user_metadata: { name: 'Delete User' }
          }
        }
      }));
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
    await page.route('**/gdpr/delete-account', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Account deleted successfully' })
      });
    });
    
    await page.route('**/auth/v1/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.getByRole('button', { name: 'Konto löschen' }).click();
    await logPageDebugInfo(page, 'Clicked delete account button');
    
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/gdpr/delete-account')
    );
    
    await page.getByRole('button', { name: /Konto löschen/ }).click();
    await logPageDebugInfo(page, 'Clicked confirm delete button');
    
    const response = await responsePromise;
    await logRequestDebugInfo(
      response as any,
      'Delete Account API',
      { includeHeaders: true }
    );
    
    await page.waitForURL('http://localhost:5173/');
    await expect(page.url()).toBe('http://localhost:5173/');
    
    await logPageDebugInfo(page, 'Redirected to home page after account deletion', { 
      takeScreenshot: true,
      stopTrace: true 
    });
    
    await page.goto('http://localhost:5173/login');
    
    await page.getByLabel('E-Mail').fill(testUser.email);
    await page.getByLabel('Passwort').fill(testUser.password);
    await page.getByRole('button', { name: 'Anmelden' }).click();
    
    await expect(page.getByText('Ungültige Anmeldedaten')).toBeVisible();
    
    await logPageDebugInfo(page, 'Login failed for deleted user as expected', { 
      takeScreenshot: true 
    });
  });
});
