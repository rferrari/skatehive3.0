/**
 * Enhanced Device Detection Test for Skatehive3.0
 * This demonstrates the improved device detection that will show better data in the dashboard
 */

import { getDetailedDeviceInfo } from '@/lib/utils/videoUpload';

/**
 * Test the enhanced device detection and log the results
 */
export function testEnhancedDeviceDetection() {
  const deviceData = getDetailedDeviceInfo();
  
  console.log('🔍 Enhanced Device Detection Results:');
  console.log('=====================================');
  console.log(`Platform: ${deviceData.platform}`);
  console.log(`Device Info: ${deviceData.deviceInfo}`);
  console.log(`Browser Info: ${deviceData.browserInfo}`);
  console.log(`Viewport: ${deviceData.viewport}`);
  console.log(`Connection: ${deviceData.connectionType}`);
  console.log('=====================================');
  
  // Expected dashboard display based on device
  let dashboardDisplay = '❓ Unknown';
  
  if (deviceData.deviceInfo.includes('macOS')) {
    dashboardDisplay = '💻 Mac';
  } else if (deviceData.deviceInfo.includes('Windows')) {
    dashboardDisplay = '💻 Win';
  } else if (deviceData.deviceInfo.includes('Linux')) {
    dashboardDisplay = '💻 Linux';
  } else if (deviceData.deviceInfo.includes('iOS')) {
    dashboardDisplay = '📱 iPhone';
  } else if (deviceData.deviceInfo.includes('Android')) {
    dashboardDisplay = '📱 Android';
  }
  
  console.log(`🎯 Expected Dashboard Display: ${dashboardDisplay}`);
  
  return {
    deviceData,
    dashboardDisplay,
    testResults: {
      hasOS: !deviceData.deviceInfo.includes('unknown'),
      hasBrowser: !deviceData.browserInfo.includes('unknown'),
      hasViewport: deviceData.viewport !== '0x0',
      hasConnection: deviceData.connectionType !== 'unknown'
    }
  };
}

/**
 * Mock video upload test with enhanced device data
 */
export async function mockVideoUploadWithDeviceData(
  creator: string = 'test_user',
  userHP: number = 100
) {
  const deviceData = getDetailedDeviceInfo();
  
  console.log('🎬 Mock Video Upload with Enhanced Device Data:');
  console.log('===============================================');
  
  // This is what would be sent to the video-worker API
  const mockFormData = {
    video: '[FILE_BLOB]',
    creator: creator,
    userHP: userHP.toString(),
    
    // Enhanced device data (NEW!)
    platform: deviceData.platform,
    deviceInfo: deviceData.deviceInfo,
    browserInfo: deviceData.browserInfo,
    viewport: deviceData.viewport,
    connectionType: deviceData.connectionType,
    correlationId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  console.log('📤 Data that would be sent to video-worker:');
  Object.entries(mockFormData).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  return mockFormData;
}

/**
 * Device detection comparison (old vs new)
 */
export function compareDeviceDetection() {
  const enhanced = getDetailedDeviceInfo();
  
  // Old detection (simplified)
  const ua = navigator.userAgent.toLowerCase();
  const oldDetection = {
    platform: ua.includes('mobile') ? 'mobile' : 'desktop',
    deviceInfo: `web/${navigator.platform}/generic`,
    browserInfo: navigator.userAgent.substring(0, 50) + '...'
  };
  
  console.log('📊 Device Detection Comparison:');
  console.log('===============================');
  console.log('🔴 OLD Detection:');
  console.log(`  Platform: ${oldDetection.platform}`);
  console.log(`  Device Info: ${oldDetection.deviceInfo}`);
  console.log(`  Browser Info: ${oldDetection.browserInfo}`);
  console.log('');
  console.log('🟢 NEW Enhanced Detection:');
  console.log(`  Platform: ${enhanced.platform}`);
  console.log(`  Device Info: ${enhanced.deviceInfo}`);
  console.log(`  Browser Info: ${enhanced.browserInfo}`);
  console.log('');
  console.log('🎯 Improvement Benefits:');
  console.log('  ✅ Accurate OS detection (macOS, Windows, iOS, Android)');
  console.log('  ✅ Precise browser identification (Chrome, Safari, Firefox, Edge)');
  console.log('  ✅ Device type classification (mobile, tablet, desktop)');
  console.log('  ✅ Human-readable browser info');
  console.log('  ✅ Dashboard will show device icons instead of "Unknown"');
  
  return { enhanced, oldDetection };
}

export default testEnhancedDeviceDetection;
