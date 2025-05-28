import { test, expect } from '@playwright/test';
import { logPageDebugInfo } from '../src/utils/logPage';
import { logRequestDebugInfo } from '../src/utils/logRequest';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await logPageDebugInfo(page, 'Login page loaded');
  });

  test('should show validation errors for invalid credentials', async ({ page }) => {
    await page.getByLabel('E-Mail').fill('invalid@example.com');
    await page.getByLabel('Passwort').fill('wrongpassword');
    
    await logPageDebugInfo(page, 'Filled in invalid credentials');
    
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/auth/v1/token') && 
      response.request().method() === 'POST'
    );
    
    await page.locator('button[type="submit"]').click();
    
    const startTime = Date.now();
    const response = await responsePromise;
    
    await logRequestDebugInfo(
      response, 
      'Login API', 
      { startTime, maxBodyLength: 500 },
      'POST'
    );
    
    await expect(page.getByText('Ungültige Anmeldedaten')).toBeVisible();
    await logPageDebugInfo(page, 'Error message displayed', { takeScreenshot: true });
  });
  
  test('should make API request with correct payload', async ({ page, request }) => {
    await page.getByLabel('E-Mail').fill('test@example.com');
    await page.getByLabel('Passwort').fill('password123');
    
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/auth/v1/token')
    );
    
    await page.locator('button[type="submit"]').click();
    
    const startTime = Date.now();
    const response = await responsePromise;
    
    await logRequestDebugInfo(
      response, 
      'Login API Request', 
      { startTime, includeHeaders: true },
      'POST'
    );
    
    await logPageDebugInfo(page, 'Login attempt completed');
  });
  
  test('should log direct API requests', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.post('http://localhost:5173/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password123'
      }
    });
    
    await logRequestDebugInfo(
      response,
      'Direct API Request',
      { startTime },
      'POST'
    );
    
  });
});
