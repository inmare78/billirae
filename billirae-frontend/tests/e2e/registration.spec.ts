import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'Password123!'
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/register');
    
    await page.waitForLoadState('domcontentloaded');
    
    await page.getByRole('heading', { name: /Registrieren/i }).waitFor({ state: 'visible', timeout: 10000 });
  });
  
  test('should display registration form with all fields', async ({ page }) => {
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('E-Mail')).toBeVisible();
    await expect(page.getByLabel('Passwort')).toBeVisible();
    await expect(page.getByLabel('Passwort bestätigen')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrieren' })).toBeVisible();
    
    await expect(page.getByRole('link', { name: 'Anmelden' })).toBeVisible();
  });
  
  test('should show error when passwords do not match', async ({ page }) => {
    await page.getByLabel('Name').fill(testUser.name);
    await page.getByLabel('E-Mail').fill(testUser.email);
    await page.getByLabel('Passwort').fill(testUser.password);
    await page.getByLabel('Passwort bestätigen').fill(testUser.password + '!');
    
    await page.getByRole('button', { name: 'Registrieren' }).click();
    
    await expect(page.getByText('Die Passwörter stimmen nicht überein.')).toBeVisible();
  });
  
  test('should register user successfully and redirect to home page', async ({ page }) => {
    await page.route('**/auth/v1/signup*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: testUser.email,
            user_metadata: {
              name: testUser.name
            }
          },
          session: {
            access_token: 'test-token'
          }
        })
      });
    });
    
    await page.route('**/rest/v1/users*', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    });
    
    await page.getByLabel('Name').fill(testUser.name);
    await page.getByLabel('E-Mail').fill(testUser.email);
    await page.getByLabel('Passwort').fill(testUser.password);
    await page.getByLabel('Passwort bestätigen').fill(testUser.password);
    
    await page.getByRole('button', { name: 'Registrieren' }).click();
    
    await expect(page.getByText('Wird registriert...')).toBeVisible();
    
    await page.waitForURL('http://localhost:5173/');
    
    await expect(page.url()).toBe('http://localhost:5173/');
  });
});
