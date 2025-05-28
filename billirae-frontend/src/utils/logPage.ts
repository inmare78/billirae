// src/utils/logPage.ts
import { Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

interface LogOptions {
  takeScreenshot?: boolean;
  startTrace?: boolean;
  stopTrace?: boolean;
  traceOutputPath?: string;
}

/**
 * Logs debug information about the current page state
 * @param page Playwright Page object
 * @param context Label for the log entry
 * @param options Additional logging options (screenshots, tracing)
 */
export async function logPageDebugInfo(
  page: Page, 
  context: string = '', 
  options: LogOptions = {}
) {
  if (process.env.ENABLE_PLAYWRIGHT_LOGGING !== 'true') return

  const timestamp = new Date().toISOString().replace(/:/g, '-')
  const logDir = path.join(process.cwd(), 'playwright-logs')
  
  if (options.takeScreenshot || options.stopTrace) {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
  }

  const url = page.url()
  const title = await page.title()
  const bodyText = await page.locator('body').innerText()

  console.log(`\n🔍 DEBUG: ${context || 'Seite'}`)
  console.log(`📍 URL: ${url}`)
  console.log(`📝 Title: ${title}`)
  console.log(`📄 Body:\n${bodyText}\n`)

  if (options.takeScreenshot) {
    const screenshotPath = path.join(logDir, `${context.replace(/\s+/g, '-')}-${timestamp}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`📸 Screenshot saved to: ${screenshotPath}`)
  }

  if (options.startTrace) {
    await page.context().tracing.start({ screenshots: true, snapshots: true })
    console.log(`🔄 Tracing started for: ${context}`)
  }

  if (options.stopTrace) {
    const tracePath = options.traceOutputPath || 
      path.join(logDir, `trace-${context.replace(/\s+/g, '-')}-${timestamp}.zip`)
    
    await page.context().tracing.stop({ path: tracePath })
    console.log(`✅ Trace saved to: ${tracePath}`)
  }
}
