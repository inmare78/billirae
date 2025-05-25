import { test, expect } from '@playwright/test';

const mockCompanyData = {
  company_name: 'Test GmbH',
  first_name: 'Max',
  last_name: 'Mustermann',
  tax_id: 'DE123456789',
  email: 'test@example.com'
};

const mockFavoriteCustomer = 'Kunde XYZ GmbH';

test.describe('Profile Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('test_mode', 'true');
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          access_token: 'test-token',
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        }
      }));
      console.log('Test mode enabled via localStorage');
    });
    
    await page.goto('http://localhost:5173/profile');
    
    await page.waitForLoadState('domcontentloaded');
    
    await page.getByRole('heading', { name: /Unternehmensprofil/i }).waitFor({ state: 'visible', timeout: 10000 });
  });
  
  test('should display all tabs and allow navigation between them', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Unternehmensdaten/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Rechnungseinstellungen/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Umsatzstatistik/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Fälligkeiten/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Favoriten/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Export/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Integration/i })).toBeVisible();
    
    
    await page.getByRole('tab', { name: /Rechnungseinstellungen/i }).click();
    await expect(page.getByText(/Standard-MwSt/i)).toBeVisible();
    await expect(page.getByText(/Rechnungspräfix/i)).toBeVisible();
    
    await page.getByRole('tab', { name: /Umsatzstatistik/i }).click();
    await expect(page.getByText(/Umsatzübersicht/i, { exact: false })).toBeVisible();
    
    await page.getByRole('tab', { name: /Fälligkeiten/i }).click();
    await expect(page.getByText(/Fällige Rechnungen/i, { exact: false })).toBeVisible();
    
    await page.getByRole('tab', { name: /Favoriten/i }).click();
    await expect(page.getByText(/Häufig verwendete Kunden/i, { exact: false })).toBeVisible();
    
    await page.getByRole('tab', { name: /Export/i }).click();
    await expect(page.getByText(/Daten exportieren/i, { exact: false })).toBeVisible();
    
    await page.getByRole('tab', { name: /Integration/i }).click();
    await expect(page.getByText(/Supabase-Verbindung/i, { exact: false })).toBeVisible();
    
    await page.getByRole('tab', { name: /Unternehmensdaten/i }).click();
    await expect(page.getByText(/Stammdaten/i)).toBeVisible();
    await expect(page.locator('label:has-text("Firmenname")').first()).toBeVisible();
  });
  
  test('should save company data successfully', async ({ page }) => {
    await page.getByRole('tab', { name: /Unternehmensdaten/i }).click();
    
    await page.locator('input#company_name').fill(mockCompanyData.company_name);
    await page.locator('input#first_name').fill(mockCompanyData.first_name);
    await page.locator('input#last_name').fill(mockCompanyData.last_name);
    await page.locator('input#tax_id').fill(mockCompanyData.tax_id);
    
    await page.screenshot({ path: 'test-results/profile-before-save.png' });
    
    await page.getByRole('button', { name: /Speichern/i }).click();
    
    await expect(page.getByText(/erfolgreich/i, { exact: false })).toBeVisible({ timeout: 5000 });
    
    await page.screenshot({ path: 'test-results/profile-after-save.png' });
    
    await expect(page.locator('input#company_name')).toHaveValue(mockCompanyData.company_name);
    await expect(page.locator('input#first_name')).toHaveValue(mockCompanyData.first_name);
    await expect(page.locator('input#last_name')).toHaveValue(mockCompanyData.last_name);
    await expect(page.locator('input#tax_id')).toHaveValue(mockCompanyData.tax_id);
  });
  
  test('should display revenue chart with month selection', async ({ page }) => {
    await page.getByRole('tab', { name: /Umsatzstatistik/i }).click();
    
    await expect(page.locator('[aria-label="Umsatzdiagramm"]')).toBeVisible({ timeout: 5000 });
    
    await page.getByRole('combobox', { name: /Monat auswählen/i }).click();
    await page.getByRole('option', { name: /April 2025/i }).click();
    
    await expect(page.locator('[aria-label="Umsatzdiagramm"]')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/revenue-chart.png' });
    
    await expect(page.locator('rect.recharts-bar-rectangle')).toBeVisible();
  });
  
  test('should manage favorite customers', async ({ page }) => {
    await page.getByRole('tab', { name: /Favoriten/i }).click();
    
    await expect(page.getByText(/Häufig verwendete Kunden/i, { exact: false })).toBeVisible();
    
    await page.getByPlaceholder(/Kundenname eingeben/i).fill(mockFavoriteCustomer);
    
    await page.getByRole('option').first().click();
    
    await page.getByRole('button', { name: /Hinzufügen/i }).click();
    
    await expect(page.getByText(mockFavoriteCustomer)).toBeVisible();
    
    await page.screenshot({ path: 'test-results/favorites-added.png' });
    
    await page.getByRole('button', { name: /Entfernen/i }).click();
    
    await expect(page.getByText(mockFavoriteCustomer)).not.toBeVisible();
    
    await page.screenshot({ path: 'test-results/favorites-removed.png' });
  });
});
