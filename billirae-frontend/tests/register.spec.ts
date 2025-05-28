import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

test('User can register successfully with valid data', async ({ page }) => {
  const timestamp = Date.now()
  const testEmail = `user${timestamp}@example.com`

  await page.goto('/register')

  await page.getByLabel('Name').fill('Max Mustermann')
  await page.getByLabel('E-Mail').fill(testEmail)
  await page.getByLabel('Passwort').fill('Geheim123!')
  await page.getByLabel('Passwort bestätigen').fill('Geheim123!')

  await page.locator('button[type="submit"]').click()

  await page.waitForURL('/')
  await expect(page).toHaveURL('/')

  // ✅ Supabase-Datenbankprüfung
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('email', testEmail)
    .single()

  expect(error).toBeNull()
  expect(data).not.toBeNull()
  expect(data.email).toBe(testEmail)
})

test('Registration fails if required fields are empty', async ({ page }) => {
  await page.goto('/register')
  await page.locator('button[type="submit"]').click()

  // HTML5-Feldvalidierung prüft 4 Pflichtfelder
  await expect(page.locator('input:invalid')).toHaveCount(4)
})
