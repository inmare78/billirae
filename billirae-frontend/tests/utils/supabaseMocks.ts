/**
 * Supabase mocking utilities for tests
 */

/**
 * Mock Supabase authentication
 * @param page Playwright page
 * @param authData Auth data to mock
 */
export const mockSupabaseAuth = async (page: any, authData: any) => {
  await page.addInitScript((data: any) => {
    // Mock localStorage getItem for auth
    const originalGetItem = localStorage.getItem;
    window.localStorage.getItem = function(key: string) {
      if (key === 'supabase.auth.token') {
        return JSON.stringify({
          currentSession: data.session,
          expiresAt: Date.now() + 3600000,
        });
      }
      return originalGetItem.call(this, key);
    };
    
    // Mock Supabase auth methods
    (window as any).mockSupabaseAuth = {
      user: data.user,
      session: data.session
    };
    
    // Intercept Supabase auth calls
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : (input as Request).url;
      
      if (url.includes('/auth/v1/token')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: data.user,
            session: data.session
          }),
          status: 200,
        } as Response);
      }
      
      if (url.includes('/auth/v1/user')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: data.user
          }),
          status: 200,
        } as Response);
      }
      
      return originalFetch.call(window, input, init);
    };
  }, authData);
};

/**
 * Mock Supabase profile data
 * @param page Playwright page
 * @param profileData Profile data to mock
 */
export const mockSupabaseProfile = async (page: any, profileData: any) => {
  await page.addInitScript((data: any) => {
    // Intercept Supabase data calls
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : (input as Request).url;
      
      if (url.includes('/rest/v1/users') && init?.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
          status: 200,
        } as Response);
      }
      
      if (url.includes('/rest/v1/users') && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...data, ...JSON.parse(init.body as string) }),
          status: 201,
        } as Response);
      }
      
      if (url.includes('/rest/v1/users') && init?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...data, ...JSON.parse(init.body as string) }),
          status: 200,
        } as Response);
      }
      
      if (url.includes('/rest/v1/users') && init?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
          status: 200,
        } as Response);
      }
      
      return originalFetch.call(window, input, init);
    };
  }, profileData);
};

/**
 * Mock Supabase data export
 * @param page Playwright page
 */
export const mockSupabaseDataExport = async (page: any) => {
  await page.addInitScript(() => {
    // Mock the Blob and URL.createObjectURL
    const originalBlob = window.Blob;
    const originalCreateObjectURL = URL.createObjectURL;
    
    window.Blob = function(array: BlobPart[], options?: BlobPropertyBag) {
      return new originalBlob(array, options);
    } as any;
    
    URL.createObjectURL = function(obj: Blob | MediaSource) {
      if (obj instanceof Blob) {
        return 'mock://download-url';
      }
      return originalCreateObjectURL(obj);
    };
  });
};

/**
 * Mock Supabase account deletion
 * @param page Playwright page
 * @param success Whether the deletion should succeed
 */
export const mockSupabaseAccountDeletion = async (page: any, success = true) => {
  await page.addInitScript((shouldSucceed: boolean) => {
    // Intercept Supabase data calls
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : (input as Request).url;
      
      if (url.includes('/rest/v1/users') && init?.method === 'DELETE') {
        if (shouldSucceed) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
            status: 200,
          } as Response);
        } else {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ 
              error: 'Error deleting account',
              message: 'Could not delete account'
            }),
            status: 400,
          } as Response);
        }
      }
      
      return originalFetch.call(window, input, init);
    };
  }, success);
};
