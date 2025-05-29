import { test, expect } from '@playwright/test';
import { logPageDebugInfo } from '../../src/utils/logPage';

test.describe('User Profile Page', () => {
  test.beforeEach(async ({ page }) => {
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
    
    await page.goto('http://localhost:5173/profile');
    
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      await logPageDebugInfo(page, 'Navigated to profile page', { 
        takeScreenshot: true 
      });
    }
  });
  
  test('should display profile form with company information fields', async ({ page }) => {
    await expect(page.getByText('Unternehmensprofil')).toBeVisible();
    await expect(page.getByText('Stammdaten')).toBeVisible();
    
    await expect(page.getByLabel('Firmenname')).toBeVisible();
    await expect(page.getByLabel('Adresse')).toBeVisible();
    await expect(page.getByLabel('Steuernummer')).toBeVisible();
    await expect(page.getByLabel('E-Mail')).toBeVisible();
    
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      await logPageDebugInfo(page, 'Profile form displayed', { 
        takeScreenshot: true 
      });
    }
  });
  
  test('should display bank information fields', async ({ page }) => {
    await expect(page.getByText('Bankverbindung')).toBeVisible();
    
    await expect(page.getByLabel('Bank')).toBeVisible();
    await expect(page.getByLabel('IBAN')).toBeVisible();
    await expect(page.getByLabel('BIC')).toBeVisible();
    
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      await logPageDebugInfo(page, 'Bank information fields displayed', { 
        takeScreenshot: true 
      });
    }
  });
  
  test('should display logo upload section', async ({ page }) => {
    await expect(page.getByLabel('Firmenlogo')).toBeVisible();
    await expect(page.getByText('Logo auswählen')).toBeVisible();
    
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      await logPageDebugInfo(page, 'Logo upload section displayed', { 
        takeScreenshot: true 
      });
    }
  });
  
  test('should display GDPR-related buttons', async ({ page }) => {
    await expect(page.getByText('Daten exportieren (GDPR)')).toBeVisible();
    await expect(page.getByText('Konto löschen')).toBeVisible();
    
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      await logPageDebugInfo(page, 'GDPR buttons displayed', { 
        takeScreenshot: true 
      });
    }
  });
  
  test('should open delete account dialog when clicking delete button', async ({ page }) => {
    await page.getByText('Konto löschen').click();
    
    await expect(page.getByText('Diese Aktion kann nicht rückgängig gemacht werden')).toBeVisible();
    await expect(page.getByPlaceholder('LÖSCHEN')).toBeVisible();
    
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      await logPageDebugInfo(page, 'Delete account dialog opened', { 
        takeScreenshot: true 
      });
    }
    
    await page.getByText('Abbrechen').click();
  });
});
