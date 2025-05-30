import { test, expect } from '@playwright/test';
import { mockSupabaseAuth, mockSupabaseProfile } from '../utils/supabaseMocks';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseAuth(page, {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
      session: {
        access_token: 'fake-access-token',
        refresh_token: 'fake-refresh-token',
        expires_at: Date.now() + 3600,
      }
    });

    await mockSupabaseProfile(page, {
      id: 'test-user-id',
      email: 'test@example.com',
      first_name: 'Max',
      last_name: 'Mustermann',
      company_name: 'Test GmbH',
      street_1: 'Teststraße 123',
      city: 'Berlin',
      zip: '10115',
      country: 'Deutschland',
      tax_id: 'DE123456789',
      website_url: 'https://example.com',
    });

    await page.goto('/profile');
  });

  test('should display profile form with user data', async ({ page }) => {
    await expect(page.getByText('Unternehmensprofil')).toBeVisible();
    
    await expect(page.getByLabel('Firmenname')).toHaveValue('Test GmbH');
    await expect(page.getByLabel('Vorname')).toHaveValue('Max');
    await expect(page.getByLabel('Nachname')).toHaveValue('Mustermann');
    await expect(page.getByLabel('E-Mail')).toHaveValue('test@example.com');
    await expect(page.getByLabel('Adresse')).toHaveValue('Teststraße 123');
    await expect(page.getByLabel('PLZ')).toHaveValue('10115');
    await expect(page.getByLabel('Stadt')).toHaveValue('Berlin');
    await expect(page.getByLabel('Land')).toHaveValue('Deutschland');
    await expect(page.getByLabel('Steuernummer')).toHaveValue('DE123456789');
    await expect(page.getByLabel('Website')).toHaveValue('https://example.com');
  });

  test('should save profile changes', async ({ page }) => {
    await expect(page.getByText('Unternehmensprofil')).toBeVisible();
    
    await page.getByLabel('Firmenname').fill('Neue Firma GmbH');
    await page.getByLabel('Vorname').fill('Erika');
    await page.getByLabel('Nachname').fill('Musterfrau');
    
    await page.evaluate(() => {
      window.localStorage.setItem('supabase.profile.update.success', 'true');
    });
    
    await page.getByRole('button', { name: 'Speichern' }).click();
    
    await expect(page.getByText('Profil erfolgreich aktualisiert.')).toBeVisible();
  });

  test('should handle GDPR data export', async ({ page }) => {
    await expect(page.getByText('Unternehmensprofil')).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    
    await page.getByRole('button', { name: 'Daten exportieren (GDPR)' }).click();
    
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/billirae-profile-export-.*\.json/);
  });

  test('should show account deletion confirmation dialog', async ({ page }) => {
    await expect(page.getByText('Unternehmensprofil')).toBeVisible();
    
    await page.getByRole('button', { name: 'Konto löschen' }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Diese Aktion kann nicht rückgängig gemacht werden')).toBeVisible();
    
    await page.getByPlaceholder('LÖSCHEN').fill('FALSCH');
    await expect(page.getByRole('button', { name: 'Konto endgültig löschen' })).toBeDisabled();
    
    await page.getByPlaceholder('LÖSCHEN').fill('LÖSCHEN');
    await expect(page.getByRole('button', { name: 'Konto endgültig löschen' })).toBeEnabled();
  });
});
