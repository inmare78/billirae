import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { logPageDebugInfo } from '../src/utils/logPage'

// Supabase Admin-Client für Setup
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const validEmail = 'testuser@example.com'
const validPassword = 'Geheim123!'
const validName = 'Test User'

test.beforeAll(async () => {
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
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
  await logPageDebugInfo(page, 'Login page loaded')

  await page.getByLabel('E-Mail').fill(validEmail)
  await page.getByLabel('Passwort').fill(validPassword)
  
  await logPageDebugInfo(page, 'Login form filled with valid credentials')
  await page.locator('button[type="submit"]').click()

  try {
    await page.waitForURL('/', { timeout: 10000 })
    await expect(page).toHaveURL('/')
    await expect(page.getByText(/Willkommen|Dashboard|Start/i)).toBeVisible()
    await logPageDebugInfo(page, 'Successfully logged in', { takeScreenshot: true })
  } catch (error) {
    await logPageDebugInfo(page, 'Failed to login with valid credentials', { 
      takeScreenshot: true,
      startTrace: true,
      stopTrace: true 
    })
    throw error
  }
})

test('Login fails with invalid credentials', async ({ page }) => {
  await page.goto('/login')
  await logPageDebugInfo(page, 'Login page loaded for invalid credentials test')

  await page.getByLabel('E-Mail').fill('wrong@example.com')
  await page.getByLabel('Passwort').fill('FalschesPasswort!')
  
  await logPageDebugInfo(page, 'Login form filled with invalid credentials')
  await page.locator('button[type="submit"]').click()

  try {
    await logPageDebugInfo(page, 'After login attempt with invalid credentials', { 
      takeScreenshot: true 
    })
    
    await expect(
      page.getByText(/fehlgeschlagen|falsch|nicht.*gültig/i)
    ).toBeVisible()
    await expect(page).toHaveURL('/login')
    
    await logPageDebugInfo(page, 'Error message displayed correctly')
  } catch (error) {
    await logPageDebugInfo(page, 'Unexpected behavior with invalid credentials', { 
      takeScreenshot: true,
      startTrace: true,
      stopTrace: true 
    })
    throw error
  }
})
