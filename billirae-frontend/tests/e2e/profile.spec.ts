import { test, expect } from '@playwright/test';
import { logPageDebugInfo } from '../../src/utils/logPage';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const testEmail = `profile-test-${Date.now()}@example.com`;
const testPassword = 'TestPassword123!';

test.describe('Profile Page', () => {
  test.beforeAll(async () => {
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (error) {
      console.error('Error creating test user:', error);
    }
  });

  test.afterAll(async () => {
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users?.users.find(user => user.email === testEmail);
    
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id);
    }
  });

  test('should allow user to update profile information', async ({ page }) => {
    await page.goto('/login');
    await logPageDebugInfo(page, 'Login page loaded');
    
    await page.getByLabel('E-Mail').fill(testEmail);
    await page.getByLabel('Passwort').fill(testPassword);
    await page.locator('button[type="submit"]').click();
    
    await page.waitForURL('/', { timeout: 10000 });
    await logPageDebugInfo(page, 'Login successful');
    
    await page.goto('/profile');
    await logPageDebugInfo(page, 'Profile page loaded', { takeScreenshot: true });
    
    const testCompany = `Test Company ${Date.now()}`;
    await page.getByLabel('Firmenname').fill(testCompany);
    await page.getByLabel('Adresse').fill('Teststraße 123\n12345 Berlin');
    await page.getByLabel('Steuernummer').fill('123/456/78910');
    await page.getByLabel('E-Mail').fill(testEmail);
    await page.getByLabel('Telefon').fill('+49 123 4567890');
    
    await page.getByLabel('Bank').fill('Test Bank');
    await page.getByLabel('IBAN').fill('DE89370400440532013000');
    await page.getByLabel('BIC').fill('TESTBICX');
    
    await logPageDebugInfo(page, 'Profile form filled', { takeScreenshot: true });
    
    await page.locator('button[type="submit"]').click();
    
    try {
      await expect(page.getByText('Profil erfolgreich aktualisiert')).toBeVisible({ timeout: 5000 });
      await logPageDebugInfo(page, 'Profile update successful');
    } catch (error) {
      await logPageDebugInfo(page, 'Profile update failed', { 
        takeScreenshot: true,
        startTrace: true,
        stopTrace: true 
      });
      throw error;
    }
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByLabel('Firmenname')).toHaveValue(testCompany);
    await expect(page.getByLabel('IBAN')).toHaveValue('DE89370400440532013000');
    
    await logPageDebugInfo(page, 'Profile data persisted after reload', { takeScreenshot: true });
  });
  
  test('should validate form fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill(testEmail);
    await page.getByLabel('Passwort').fill(testPassword);
    await page.locator('button[type="submit"]').click();
    
    await page.goto('/profile');
    await logPageDebugInfo(page, 'Profile page loaded for validation test');
    
    await page.getByLabel('IBAN').fill('INVALID-IBAN');
    await page.locator('button[type="submit"]').click();
    
    await expect(page.getByText('Bitte geben Sie eine gültige IBAN ein')).toBeVisible();
    await logPageDebugInfo(page, 'IBAN validation working', { takeScreenshot: true });
    
    await page.getByLabel('IBAN').fill('DE89370400440532013000'); // Fix IBAN
    await page.getByLabel('BIC').fill('INVALID');
    await page.locator('button[type="submit"]').click();
    
    await expect(page.getByText('Bitte geben Sie einen gültigen BIC ein')).toBeVisible();
    await logPageDebugInfo(page, 'BIC validation working', { takeScreenshot: true });
  });
  
  test('should allow GDPR data export', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill(testEmail);
    await page.getByLabel('Passwort').fill(testPassword);
    await page.locator('button[type="submit"]').click();
    
    await page.goto('/profile');
    
    const downloadPromise = page.waitForEvent('download');
    
    await page.getByText('Daten exportieren (GDPR)').click();
    
    try {
      const download = await downloadPromise;
      await logPageDebugInfo(page, `GDPR export successful: ${download.suggestedFilename()}`);
    } catch (error) {
      await logPageDebugInfo(page, 'GDPR export failed', { 
        takeScreenshot: true,
        startTrace: true,
        stopTrace: true 
      });
      throw error;
    }
  });
});
