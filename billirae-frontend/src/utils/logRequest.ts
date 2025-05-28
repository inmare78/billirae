/**
 * Utility for logging API request/response information during Playwright tests
 * Centralizes logging and adds structured output for API debugging
 */

import { APIResponse } from '@playwright/test';

interface LogRequestOptions {
  maxBodyLength?: number;
  includeHeaders?: boolean;
  startTime?: number; // Optional start time for calculating elapsed time
}

/**
 * Log debug information about an API response
 * @param response Playwright APIResponse object
 * @param label Optional descriptive label for the log entry
 * @param options Configuration options
 * @param method Optional HTTP method if known (GET, POST, etc.)
 */
export async function logRequestDebugInfo(
  response: APIResponse,
  label?: string,
  options: LogRequestOptions = {},
  method?: string
): Promise<void> {
  const isLoggingEnabled = process.env.ENABLE_PLAYWRIGHT_LOGGING === 'true';
  
  if (!isLoggingEnabled) {
    return;
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const url = response.url();
  const status = response.status();
  const statusText = response.statusText();
  
  const requestMethod = method || "REQUEST";
  
  const endTime = Date.now();
  const elapsedMs = options.startTime ? (endTime - options.startTime) : null;
  
  const maxBodyLength = options.maxBodyLength ?? 1000;
  const includeHeaders = options.includeHeaders ?? true;
  
  let statusEmoji = '🔍';
  if (status >= 200 && status < 300) statusEmoji = '✅';
  else if (status >= 400 && status < 500) statusEmoji = '⚠️';
  else if (status >= 500) statusEmoji = '❌';
  
  console.log(`\n[${timestamp}] ${statusEmoji} ${label ? `${label}: ` : ''}${requestMethod} ${url}`);
  console.log(`└─ Status: ${status} ${statusText}`);
  
  if (elapsedMs !== null) {
    console.log(`└─ Time: ${elapsedMs}ms`);
  }
  
  if (includeHeaders) {
    const headers = response.headers();
    console.log('└─ Headers:');
    Object.entries(headers).forEach(([key, value]) => {
      console.log(`   └─ ${key}: ${value}`);
    });
  }
  
  try {
    const bodyText = await response.text();
    
    let bodyContent: string;
    try {
      const bodyJson = JSON.parse(bodyText);
      bodyContent = JSON.stringify(bodyJson, null, 2);
    } catch (e) {
      bodyContent = bodyText;
    }
    
    const isTruncated = bodyContent.length > maxBodyLength;
    const displayBody = isTruncated 
      ? bodyContent.substring(0, maxBodyLength) + '...[truncated]' 
      : bodyContent;
    
    console.log('└─ Body:');
    console.log(displayBody);
    
    if (isTruncated) {
      console.log(`   └─ (Response truncated, ${bodyContent.length} total characters)`);
    }
  } catch (error) {
    console.log(`└─ Body: Could not read response body: ${error}`);
  }
}
