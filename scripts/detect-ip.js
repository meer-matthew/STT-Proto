#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Detect IP Script
 * Automatically detects your local IP address and updates api.config.ts
 */

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();

    // Priority order: look for WiFi (en0), then Ethernet (en1), then any other interface
    const priorities = ['en0', 'en1', 'eth0', 'Wi-Fi', 'Ethernet'];

    // First, try priority interfaces
    for (const interfaceName of priorities) {
        const iface = interfaces[interfaceName];
        if (iface) {
            for (const alias of iface) {
                if (alias.family === 'IPv4' && !alias.internal) {
                    return alias.address;
                }
            }
        }
    }

    // If no priority interface found, try all interfaces
    for (const interfaceName in interfaces) {
        const iface = interfaces[interfaceName];
        for (const alias of iface) {
            // Skip internal (loopback) and IPv6 addresses
            if (alias.family === 'IPv4' && !alias.internal) {
                // Prefer 192.168.x.x or 10.x.x.x addresses (typical local network)
                if (alias.address.startsWith('192.168.') || alias.address.startsWith('10.')) {
                    return alias.address;
                }
            }
        }
    }

    // Fallback to any non-internal IPv4 address
    for (const interfaceName in interfaces) {
        const iface = interfaces[interfaceName];
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }

    return null;
}

function updateApiConfig(ipAddress) {
    // Write to JSON config file for runtime use
    const jsonConfigPath = path.join(__dirname, '..', 'src', 'config', 'ip-config.json');

    try {
        const config = { HOST_IP: ipAddress };
        fs.writeFileSync(jsonConfigPath, JSON.stringify(config, null, 2), 'utf8');
        console.log(`✅ Updated HOST_IP to ${ipAddress} in ip-config.json`);
        return true;
    } catch (error) {
        console.error('❌ Error updating ip-config.json:', error.message);
        return false;
    }
}

function main() {
    console.log('🔍 Detecting local IP address...');

    const ipAddress = getLocalIpAddress();

    if (!ipAddress) {
        console.error('❌ Could not detect local IP address');
        console.log('Please manually set HOST_IP in src/config/api.config.ts');
        process.exit(1);
    }

    console.log(`📍 Detected IP address: ${ipAddress}`);

    updateApiConfig(ipAddress);
}

main();
