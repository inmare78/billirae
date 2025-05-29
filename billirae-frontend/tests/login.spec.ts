import { test, expect } from '@playwright/test';
import { logPageDebugInfo } from '../src/utils/logPage';
import { logRequestDebugInfo } from '../src/utils/logRequest';
import { setupSupabaseAuthMocks, mockUsers, mockResponses } from './utils/supabaseMocks';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup Supabase auth mocks
    await setupSupabaseAuthMocks(page);
    
    await page.goto('http://localhost:5173/login');
    await logPageDebugInfo(page, 'Login page loaded');
  });

  test('should show validation errors for invalid credentials', async ({ page }) => {
    await page.getByLabel('E-Mail').fill('invalid@example.com');
    await page.getByLabel('Passwort').fill('wrongpassword');
    
    await logPageDebugInfo(page, 'Filled in invalid credentials');
    
    // Override the default mock to simulate invalid credentials
    await page.route('**/auth/v1/token**', async (route) => {
      const requestData = await route.request().postDataJSON();
      
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        console.log(`Login attempt with invalid credentials: ${JSON.stringify(requestData)}`);
      }
      
      await route.fulfill(mockResponses.unauthorized);
      
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        await logRequestDebugInfo(
          await route.fetch(),
          'Login API - Invalid Credentials', 
          { includeHeaders: true },
          'POST'
        );
      }
    });
    
    await page.locator('button[type="submit"]').click();
    
    await expect(page.getByText('Ungültige Anmeldedaten')).toBeVisible();
    await logPageDebugInfo(page, 'Error message displayed', { takeScreenshot: true });
  });
  
  test('should make API request with correct payload', async ({ page }) => {
    await page.getByLabel('E-Mail').fill('test@example.com');
    await page.getByLabel('Passwort').fill('password123');
    
    // Create a request spy
    let requestPayload: any = null;
    
    await page.route('**/auth/v1/token**', async (route) => {
      const data = await route.request().postDataJSON();
      requestPayload = data;
      
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        console.log(`Login request payload: ${JSON.stringify(data)}`);
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: mockUsers.testUser,
            session: {
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              expires_at: Date.now() + 3600000
            }
          }
        })
      });
      
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        await logRequestDebugInfo(
          await route.fetch(),
          'Login API Request', 
          { includeHeaders: true },
          'POST'
        );
      }
    });
    
    await page.locator('button[type="submit"]').click();
    
    // Verify the request payload
    expect(requestPayload).toHaveProperty('email', 'test@example.com');
    expect(requestPayload).toHaveProperty('password', 'password123');
    
    await logPageDebugInfo(page, 'Login attempt completed');
    
    // Verify redirect after successful login
    await expect(page).toHaveURL(/.*\/dashboard|.*\/$/);
  });
  
  test('should handle direct API requests', async ({ request, page }) => {
    // Setup a mock server for direct API requests
    await page.route('**/api/auth/login', async (route) => {
      const data = await route.request().postDataJSON();
      
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        console.log(`Direct API login request: ${JSON.stringify(data)}`);
      }
      
      if (data.email === 'test@example.com' && data.password === 'password123') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: mockUsers.testUser,
            token: 'mock-jwt-token'
          })
        });
      } else {
        await route.fulfill(mockResponses.unauthorized);
      }
      
      if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
        await logRequestDebugInfo(
          await route.fetch(),
          'Direct API Request',
          { includeHeaders: true },
          'POST'
        );
      }
    });
    
    // Make a direct API request
    const response = await request.post('http://localhost:5173/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password123'
      }
    });
    
    // Verify the response
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('user');
    expect(responseData).toHaveProperty('token');
  });
});
