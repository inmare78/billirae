import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { logPageDebugInfo } from '../src/utils/logPage'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

test('User can register successfully with valid data', async ({ page }) => {
  const timestamp = Date.now()
  const testEmail = `user${timestamp}@example.com`

  await page.goto('/register')
  await logPageDebugInfo(page, 'Registration page loaded')

  await page.getByLabel('Name').fill('Max Mustermann')
  await page.getByLabel('E-Mail').fill(testEmail)
  await page.getByLabel('Passwort').fill('Geheim123!')
  await page.getByLabel('Passwort bestätigen').fill('Geheim123!')

  await logPageDebugInfo(page, 'Form filled before submission')
  await page.locator('button[type="submit"]').click()

  try {
    await page.waitForURL('/', { timeout: 10000 })
    await expect(page).toHaveURL('/')
    await logPageDebugInfo(page, 'Redirected after successful registration', { takeScreenshot: true })
  } catch (error) {
    await logPageDebugInfo(page, 'Failed to redirect after registration', { 
      takeScreenshot: true,
      startTrace: true,
      stopTrace: true 
    })
    throw error
  }

  // ✅ Supabase-Datenbankprüfung
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('email', testEmail)
    .single()

  expect(error).toBeNull()
  expect(data).not.toBeNull()
  if (data) {
    expect(data.email).toBe(testEmail)
  }
})

test('Registration fails if required fields are empty', async ({ page }) => {
  await page.goto('/register')
  await logPageDebugInfo(page, 'Empty registration form loaded')
  
  await page.locator('button[type="submit"]').click()
  
  // HTML5-Feldvalidierung prüft 4 Pflichtfelder
  try {
    await expect(page.locator('input:invalid')).toHaveCount(4)
    await logPageDebugInfo(page, 'Form validation triggered correctly')
  } catch (error) {
    await logPageDebugInfo(page, 'Form validation failed', { 
      takeScreenshot: true,
      startTrace: true,
      stopTrace: true 
    })
    throw error
  }
})
