// src/utils/logPage.ts
import { Page } from '@playwright/test'

export async function logPageDebugInfo(page: Page, context: string = '') {
  if (process.env.DEBUG !== 'true') return

  const url = page.url()
  const title = await page.title()
  const bodyText = await page.locator('body').innerText()

  console.log(`\n🔍 DEBUG: ${context || 'Seite'}`)
  console.log(`📍 URL: ${url}`)
  console.log(`📝 Title: ${title}`)
  console.log(`📄 Body:\n${bodyText}\n`)
}
