/**
 * Utility for logging page-related debug information during testing
 */
export const logPageDebugInfo = async (
  window: Window,
  message: string,
  options: {
    takeScreenshot?: boolean;
    startTrace?: boolean;
    stopTrace?: boolean;
  } = {}
) => {
  if (process.env.ENABLE_PLAYWRIGHT_LOGGING !== 'true') {
    return;
  }

  const { takeScreenshot = false, startTrace = false, stopTrace = false } = options;

  try {
    console.log(`\n----- PAGE DEBUG INFO: ${message} -----`);
    
    console.log(`Current URL: ${window.location.href}`);
    
    console.log(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
    
    const isTestMode = localStorage.getItem('test_mode') === 'true';
    console.log(`Test Mode: ${isTestMode ? 'Enabled' : 'Disabled'}`);
    
    if (takeScreenshot) {
      console.log('Screenshot: Requested (will be taken by Playwright)');
    }
    
    if (startTrace) {
      console.log('Trace: Started');
    }
    
    if (stopTrace) {
      console.log('Trace: Stopped');
    }
    
    console.log(`----- END PAGE DEBUG INFO: ${message} -----\n`);
  } catch (error) {
    console.error('Error logging page debug info:', error);
  }
};

export default logPageDebugInfo;
