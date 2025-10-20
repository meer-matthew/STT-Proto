import { Platform } from 'react-native';

/**
 * API Configuration
 *
 * To find your computer's IP address:
 * - Mac/Linux: Run `ifconfig | grep "inet " | grep -v 127.0.0.1` in terminal
 * - Windows: Run `ipconfig` in command prompt
 *
 * Then update HOST_IP below with your computer's local IP address
 */

// CONFIGURE THIS: Set your computer's IP address for physical device testing
const HOST_IP = '192.0.0.2'; // UPDATE THIS with your computer's IP address

// API Configuration
const API_PORT = 5001;

// Auto-detect environment
const getBaseUrl = (): string => {
    // Check if running on physical device
    // You can manually override this by setting FORCE_PHYSICAL_DEVICE to true
    // const FORCE_PHYSICAL_DEVICE = true; // SET TO TRUE FOR PHYSICAL DEVICE
    //
    // if (FORCE_PHYSICAL_DEVICE) {
    //     return `http://${HOST_IP}:${API_PORT}`;
    // }


    // Android Emulator
    if (Platform.OS === 'android') {
        return `http://10.0.2.2:${API_PORT}`;
    }

    // iOS Simulator (or fallback)
    return `http://localhost:${API_PORT}`;
};

export const API_CONFIG = {
    BASE_URL: getBaseUrl(),
    AUTH_URL: `${getBaseUrl()}/api/auth`,
    CONVERSATION_URL: `${getBaseUrl()}/api/conversation`,
    TIMEOUT: 30000, // 30 seconds
    HOST_IP, // Expose for debugging
    API_PORT, // Expose for debugging
};

// Helper to check current configuration
export const getApiInfo = () => ({
    baseUrl: API_CONFIG.BASE_URL,
    platform: Platform.OS,
    hostIp: HOST_IP,
    port: API_PORT,
});

// Log configuration on import (helpful for debugging)
if (__DEV__) {
    console.log('API Configuration:', getApiInfo());
}