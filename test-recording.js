/**
 * Test script for video recording functionality
 * Run this in your React Native development environment
 */

import { Platform } from 'react-native';
import RecordingTest from './src/utils/RecordingTest';

// Test camera availability
export const testCameraAvailability = async () => {
  console.log('🧪 Testing camera availability...');
  try {
    const results = await RecordingTest.testCameraAvailability();
    console.log('✅ Camera test results:', results);
    return results;
  } catch (error) {
    console.error('❌ Camera test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test device capabilities
export const testDeviceCapabilities = () => {
  console.log('📱 Testing device capabilities...');
  const capabilities = RecordingTest.getDeviceCapabilities();
  console.log('✅ Device capabilities:', capabilities);
  return capabilities;
};

// Test recording options validation
export const testRecordingOptions = () => {
  console.log('⚙️ Testing recording options...');
  const options = RecordingTest.getRecommendedRecordingOptions(300);
  const validation = RecordingTest.validateRecordingOptions(options);
  console.log('✅ Recording options:', options);
  console.log('✅ Validation results:', validation);
  return { options, validation };
};

// Run all tests
export const runAllTests = async () => {
  console.log('🚀 Starting comprehensive recording tests...');
  console.log('Platform:', Platform.OS, Platform.Version);
  
  // Test 1: Device capabilities
  const capabilities = testDeviceCapabilities();
  
  // Test 2: Camera availability
  const cameraTest = await testCameraAvailability();
  
  // Test 3: Recording options
  const optionsTest = testRecordingOptions();
  
  // Summary
  const summary = {
    platform: Platform.OS,
    platformVersion: Platform.Version,
    capabilities: capabilities,
    cameraAvailable: cameraTest.success,
    optionsValid: optionsTest.validation.isValid,
    timestamp: new Date().toISOString(),
  };
  
  console.log('📊 Test Summary:', summary);
  
  if (summary.cameraAvailable && summary.optionsValid) {
    console.log('🎉 All tests passed! Recording should work correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
  
  return summary;
};

// Export for use in other files
export default {
  testCameraAvailability,
  testDeviceCapabilities,
  testRecordingOptions,
  runAllTests,
};

