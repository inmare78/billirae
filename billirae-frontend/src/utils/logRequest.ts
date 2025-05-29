/**
 * Utility for logging API request details during testing and debugging
 */
export const logRequestDebugInfo = async (
  response: any,
  requestName: string,
  options: {
    maxBodyLength?: number;
    includeHeaders?: boolean;
  } = {},
  method: string = 'GET'
) => {
  if (process.env.ENABLE_PLAYWRIGHT_LOGGING !== 'true') {
    return;
  }

  const { maxBodyLength = 1000, includeHeaders = false } = options;

  try {
    console.log(`\n----- ${requestName} API Response (${method}) -----`);
    
    if (response.status) {
      console.log(`Status: ${response.status}`);
    }
    
    if (includeHeaders && response.headers) {
      console.log('Headers:');
      const headers = response.headers;
      
      if (typeof headers.forEach === 'function') {
        headers.forEach((value: string, key: string) => {
          console.log(`  ${key}: ${value}`);
        });
      } else if (typeof headers === 'object') {
        Object.entries(headers).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    }
    
    if (response.data) {
      let bodyStr = '';
      
      if (typeof response.data === 'string') {
        bodyStr = response.data;
      } else {
        try {
          bodyStr = JSON.stringify(response.data, null, 2);
        } catch (e) {
          bodyStr = '[Cannot stringify response data]';
        }
      }
      
      if (maxBodyLength && bodyStr.length > maxBodyLength) {
        bodyStr = bodyStr.substring(0, maxBodyLength) + '... [truncated]';
      }
      
      console.log('Body:');
      console.log(bodyStr);
    }
    
    console.log(`----- End ${requestName} API Response -----\n`);
  } catch (error) {
    console.error('Error logging request debug info:', error);
  }
};

export default logRequestDebugInfo;
