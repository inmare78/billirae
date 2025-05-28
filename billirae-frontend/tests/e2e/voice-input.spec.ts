import { test, expect } from '@playwright/test';
import { logPageDebugInfo } from '../../src/utils/logPage';

test.describe('Voice Input Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('test_mode', 'true');
    });
    
    await page.goto('http://localhost:5173/create-invoice');
    await logPageDebugInfo(page, 'Voice input test - page loaded');
  });
  
  test('should display example text for voice input', async ({ page }) => {
    try {
      await logPageDebugInfo(page, 'Before checking example text', { takeScreenshot: true });
      
      await expect(page.getByText('Beispiel: "Drei Massagen à 80 Euro für Max Mustermann', { exact: false })).toBeVisible();
      
      await logPageDebugInfo(page, 'Example text visible successfully');
    } catch (error) {
      await logPageDebugInfo(page, 'Failed to find example text', { 
        takeScreenshot: true,
        startTrace: true,
        stopTrace: true 
      });
      throw error;
    }
  });
});
