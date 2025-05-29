/**
 * Shared mock data and helper functions for Supabase mocking in tests
 */

export const mockUsers = {
  testUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' }
  },
  userA: {
    id: 'user-a-id',
    email: 'user-a@example.com',
    user_metadata: { name: 'User A' }
  },
  deleteUser: {
    id: 'delete-user-id',
    email: 'deleteuser@example.com',
    user_metadata: { name: 'Delete User' }
  }
};

export const mockProfiles = {
  testProfile: {
    id: 'test-profile-id',
    user_id: 'test-user-id',
    first_name: 'Max',
    last_name: 'Mustermann',
    company_name: 'Test GmbH',
    tax_id: 'DE123456789',
    website_url: 'https://example.com',
    street_1: 'Teststraße',
    street_2: '',
    house_number: '123',
    zip: '12345',
    city: 'Berlin',
    state: 'Berlin',
    country: 'Deutschland',
    country_code: 'DE',
    email: 'test@example.com',
    phone: '+49123456789',
    bank_name: 'Test Bank',
    bank_iban: 'DE89370400440532013000',
    bank_bic: 'TESTDEFF'
  },
  profileA: {
    id: 'profile-a-id',
    user_id: 'user-a-id',
    first_name: 'User',
    last_name: 'A',
    company_name: 'Company A',
    tax_id: 'DE987654321',
    website_url: 'https://company-a.com',
    street_1: 'A-Straße',
    street_2: '',
    house_number: '1',
    zip: '10115',
    city: 'Berlin',
    state: 'Berlin',
    country: 'Deutschland',
    country_code: 'DE',
    email: 'user-a@example.com',
    phone: '+49987654321',
    bank_name: 'A Bank',
    bank_iban: 'DE89370400440532013001',
    bank_bic: 'ABANKDEFF'
  }
};

export const mockInvoices = {
  invoice1: {
    id: 'invoice-1',
    user_id: 'test-user-id',
    client_id: 'client-1',
    date: '2025-05-01',
    invoice_number: 'INV-001',
    client: "Max Mustermann",
    service: "Massage",
    quantity: 3,
    unit_price: 80,
    tax_rate: 0.2,
    invoice_date: new Date().toISOString().split('T')[0],
    currency: "EUR",
    language: "de"
  }
};

export const mockCustomers = {
  customer1: {
    id: 'client-1',
    user_id: 'test-user-id',
    customer_id: 'CUST-001',
    company_name: 'Client GmbH'
  }
};

export const mockResponses = {
  success: {
    status: 200,
    body: JSON.stringify({ success: true })
  },
  created: {
    status: 201,
    body: JSON.stringify({ success: true, id: 'new-id' })
  },
  badRequest: {
    status: 400,
    body: JSON.stringify({
      error: 'Validation failed',
      message: 'Required fields cannot be empty'
    })
  },
  unauthorized: {
    status: 401,
    body: JSON.stringify({
      error: 'Unauthorized',
      message: 'Invalid credentials'
    })
  },
  forbidden: {
    status: 403,
    body: JSON.stringify({
      error: 'Permission denied',
      message: 'Sie haben keine Berechtigung für diese Aktion.'
    })
  },
  serverError: {
    status: 500,
    body: JSON.stringify({
      error: 'Internal Server Error',
      message: 'Database connection failed'
    })
  }
};

/**
 * Setup Supabase auth mocks for a page
 * @param page Playwright page
 * @param user Mock user to use for authentication
 */
export const setupSupabaseAuthMocks = async (page: any, user = mockUsers.testUser) => {
  await page.route('**/auth/v1/user', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { user } })
    });
  });

  await page.route('**/auth/v1/signup', async (route: any) => {
    const requestData = await route.request().postDataJSON();
    
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      console.log(`Auth signup request: ${JSON.stringify(requestData)}`);
    }
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          user: {
            ...user,
            email: requestData.email,
            user_metadata: { name: requestData.options?.data?.name || 'New User' }
          },
          session: null
        }
      })
    });
  });

  await page.route('**/auth/v1/token**', async (route: any) => {
    const requestData = await route.request().postDataJSON();
    
    if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
      console.log(`Auth login request: ${JSON.stringify(requestData)}`);
    }
    
    if (requestData.email === user.email && requestData.password === 'password123') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user,
            session: {
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              expires_at: Date.now() + 3600000
            }
          }
        })
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid login credentials',
          message: 'Ungültige Anmeldedaten'
        })
      });
    }
  });

  await page.route('**/auth/v1/logout', async (route: any) => {
    await route.fulfill(mockResponses.success);
  });
};

/**
 * Setup Supabase database mocks for a page
 * @param page Playwright page
 * @param options Configuration options
 */
export const setupSupabaseDatabaseMocks = async (page: any, options: {
  users?: boolean;
  invoices?: boolean;
  customers?: boolean;
  profiles?: boolean;
} = {}) => {
  const { users = true, invoices = false, customers = false, profiles = false } = options;

  if (users) {
    await page.route('**/rest/v1/users**', async (route: any) => {
      const method = route.request().method();
      
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockProfiles.testProfile)
        });
      } else if (method === 'POST') {
        const requestData = await route.request().postDataJSON();
        
        if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
          console.log(`Users POST request: ${JSON.stringify(requestData)}`);
        }
        
        if (requestData.user_id && requestData.user_id !== mockUsers.testUser.id) {
          await route.fulfill(mockResponses.forbidden);
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              ...mockProfiles.testProfile,
              ...requestData,
              updated_at: new Date().toISOString()
            })
          });
        }
      } else if (method === 'PATCH') {
        const requestData = await route.request().postDataJSON();
        
        if (process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true') {
          console.log(`Users PATCH request: ${JSON.stringify(requestData)}`);
        }
        
        if (requestData.user_id && requestData.user_id !== mockUsers.testUser.id) {
          await route.fulfill(mockResponses.forbidden);
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              ...mockProfiles.testProfile,
              ...requestData,
              updated_at: new Date().toISOString()
            })
          });
        }
      } else if (method === 'DELETE') {
        await route.fulfill(mockResponses.success);
      }
    });
  }

  if (invoices) {
    await page.route('**/rest/v1/invoices**', async (route: any) => {
      const method = route.request().method();
      
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockInvoices.invoice1])
        });
      } else if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockInvoices.invoice1,
            id: 'new-invoice-id',
            invoice_number: 'INV-002',
            created_at: new Date().toISOString()
          })
        });
      }
    });
  }

  if (customers) {
    await page.route('**/rest/v1/customers**', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockCustomers.customer1])
      });
    });
  }
};

/**
 * Setup all Supabase mocks for a page
 * @param page Playwright page
 * @param options Configuration options
 */
export const setupAllSupabaseMocks = async (page: any, options: {
  user?: any;
  users?: boolean;
  invoices?: boolean;
  customers?: boolean;
  profiles?: boolean;
} = {}) => {
  const { user = mockUsers.testUser, ...dbOptions } = options;
  
  await setupSupabaseAuthMocks(page, user);
  await setupSupabaseDatabaseMocks(page, dbOptions);
};
