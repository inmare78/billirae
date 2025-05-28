import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Supabase Admin-Client für Setup
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const validEmail = 'testuser@example.com'
const validPassword = 'Geheim123!'
const validName = 'Test User'

test.beforeAll(async () => {
  const { data: existingUsers, error } = await supabase.auth.admin.listUsers()
  const alreadyExists = existingUsers?.users.some(user => user.email === validEmail)

  if (!alreadyExists) {
    const { error: createError } = await supabase.auth.admin.createUser({
      email: validEmail,
      password: validPassword,
      email_confirm: true,
      user_metadata: { name: validName },
    })
    if (createError) {
      console.error('❌ Fehler beim Erstellen des Testbenutzers:', createError)
    }
  }
})

test('User can login successfully with valid credentials', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('E-Mail').fill(validEmail)
  await page.getByLabel('Passwort').fill(validPassword)
  await page.locator('button[type="submit"]').click()

  await page.waitForURL('/')
  await expect(page).toHaveURL('/')
  await expect(page.getByText(/Willkommen|Dashboard|Start/i)).toBeVisible()
})

test('Login fails with invalid credentials', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('E-Mail').fill('wrong@example.com')
  await page.getByLabel('Passwort').fill('FalschesPasswort!')
  await page.locator('button[type="submit"]').click()

  // 🔍 Logge den Seiteninhalt zur Analyse
  const bodyText = await page.locator('body').innerText()
  console.log('❗️Seiteninhalt bei Login-Fehler:\n', bodyText)

  await expect(
    page.getByText(/fehlgeschlagen|falsch|nicht.*gültig/i)
  ).toBeVisible()
  await expect(page).toHaveURL('/login')
})
