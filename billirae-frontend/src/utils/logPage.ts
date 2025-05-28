/**
 * Utility for logging page debug information during Playwright tests
 * Centralizes logging and adds optional screenshot and trace capabilities
 */

import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface LogOptions {
  takeScreenshot?: boolean;
  startTrace?: boolean;
  stopTrace?: boolean;
}

/**
 * Log debug information about the current page state
 * @param page Playwright Page object
 * @param label Descriptive label for the log entry
 * @param options Optional configuration for screenshots and traces
 */
export async function logPageDebugInfo(
  page: Page,
  label: string,
  options: LogOptions = {}
): Promise<void> {
  const isLoggingEnabled = process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true';
  
  if (!isLoggingEnabled) {
    return;
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  
  const context = page.context() as any;
  const testInfo = context?._options?.testInfo;
  const testName = testInfo?.project?.name || 'unknown-test';
  
  console.log(`[${timestamp}] 📋 ${label}`);
  
  try {
    if (options.takeScreenshot) {
      const screenshotDir = path.join(process.cwd(), 'test-results', 'screenshots');
      
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      
      const screenshotPath = path.join(
        screenshotDir,
        `${testName}-${timestamp}-${label.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`
      );
      
      await page.screenshot({ path: screenshotPath });
      console.log(`[${timestamp}] 📸 Screenshot saved to: ${screenshotPath}`);
    }
    
    if (options.startTrace) {
      const traceDir = path.join(process.cwd(), 'test-results', 'traces');
      
      if (!fs.existsSync(traceDir)) {
        fs.mkdirSync(traceDir, { recursive: true });
      }
      
      await page.context().tracing.start({ 
        screenshots: true,
        snapshots: true
      });
      console.log(`[${timestamp}] 🔍 Trace recording started`);
    }
    
    if (options.stopTrace) {
      const traceDir = path.join(process.cwd(), 'test-results', 'traces');
      
      if (!fs.existsSync(traceDir)) {
        fs.mkdirSync(traceDir, { recursive: true });
      }
      
      const tracePath = path.join(
        traceDir,
        `${testName}-${timestamp}-${label.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.zip`
      );
      
      await page.context().tracing.stop({ path: tracePath });
      console.log(`[${timestamp}] 🔍 Trace saved to: ${tracePath}`);
    }
    
    console.log(`[${timestamp}] 🌐 Current URL: ${page.url()}`);
    
  } catch (error) {
    console.error(`[${timestamp}] ❌ Error in logPageDebugInfo: ${error}`);
  }
}
