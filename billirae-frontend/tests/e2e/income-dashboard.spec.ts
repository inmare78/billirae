import { test, expect } from '@playwright/test';
import { logPageDebugInfo } from '../../src/utils/logPage';

test.describe('Income Dashboard', () => {
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
    
    await page.goto('http://localhost:5173/dashboard');
    
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      await logPageDebugInfo(page, 'Navigated to dashboard page', { 
        takeScreenshot: true 
      });
    }
  });
  
  test('should display monthly income chart', async ({ page }) => {
    await expect(page.getByText('Einnahmen-Dashboard')).toBeVisible();
    await expect(page.getByText('Monatliche Einnahmen')).toBeVisible();
    
    await expect(page.locator('svg')).toBeVisible();
    
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      await logPageDebugInfo(page, 'Monthly income chart displayed', { 
        takeScreenshot: true 
      });
    }
  });
  
  test('should switch to yearly income view', async ({ page }) => {
    await page.getByRole('tab', { name: 'Jährliche Übersicht' }).click();
    
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      await logPageDebugInfo(page, 'Switched to yearly income tab', { 
        takeScreenshot: true 
      });
    }
    
    await expect(page.getByText('Jährliche Einnahmen')).toBeVisible();
    
    await expect(page.getByText('2025')).toBeVisible();
    
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      await logPageDebugInfo(page, 'Yearly income data displayed', { 
        takeScreenshot: true 
      });
    }
  });
  
  test('should display correct income totals', async ({ page }) => {
    await page.getByRole('tab', { name: 'Jährliche Übersicht' }).click();
    
    await expect(page.getByText('15.300 €', { exact: false })).toBeVisible();
    
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      await logPageDebugInfo(page, 'Income totals displayed correctly', { 
        takeScreenshot: true 
      });
    }
  });
});
