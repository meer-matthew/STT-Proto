#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  STT App - Release APK Deployment${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Step 1: Build Release APK
echo -e "${YELLOW}[1/4]${NC} Building Release APK..."
cd android

if ! ./gradlew assembleRelease; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}\n"

# Step 2: Check for connected devices
echo -e "${YELLOW}[2/4]${NC} Checking for connected devices..."
DEVICES=$(adb devices | grep -v "List of attached devices" | grep "device$" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
    echo -e "${RED}❌ No connected devices found!${NC}"
    echo "Make sure your device is connected and USB debugging is enabled."
    exit 1
fi

DEVICE_COUNT=$(echo "$DEVICES" | wc -l)
echo -e "${GREEN}✅ Found $DEVICE_COUNT device(s)${NC}"
echo "$DEVICES" | while read device; do
    echo "   - $device"
done
echo ""

# Step 3: Uninstall old version and install APK on all devices
echo -e "${YELLOW}[3/4]${NC} Uninstalling old version and installing new APK..."
cd ..

SUCCESS_COUNT=0
FAIL_COUNT=0

echo "$DEVICES" | while read device; do
    if [ ! -z "$device" ]; then
        echo -e "\n   Preparing ${BLUE}$device${NC}..."

        # Uninstall existing app (ignore if not installed)
        echo -e "   ${YELLOW}→${NC} Uninstalling old app..."
        adb -s "$device" uninstall com.stt > /dev/null 2>&1

        # Install new APK
        echo -e "   ${YELLOW}→${NC} Installing new release APK..."
        if adb -s "$device" install android/app/build/outputs/apk/release/app-release.apk > /dev/null 2>&1; then
            echo -e "   ${GREEN}✅ Successfully installed on $device${NC}"
            ((SUCCESS_COUNT++))
        else
            echo -e "   ${RED}❌ Failed to install on $device${NC}"
            echo -e "   ${YELLOW}→${NC} Trying with -r flag (replace existing)..."
            if adb -s "$device" install -r android/app/build/outputs/apk/release/app-release.apk > /dev/null 2>&1; then
                echo -e "   ${GREEN}✅ Successfully installed on $device${NC}"
                ((SUCCESS_COUNT++))
            else
                echo -e "   ${RED}❌ Failed to install on $device${NC}"
                ((FAIL_COUNT++))
            fi
        fi
    fi
done

echo ""

# Step 4: Launch the app
echo -e "${YELLOW}[4/4]${NC} Launching the app on all devices..."

echo "$DEVICES" | while read device; do
    if [ ! -z "$device" ]; then
        echo "   Launching on ${BLUE}$device${NC}..."
        adb -s "$device" shell am start -n com.stt/com.stt.MainActivity > /dev/null 2>&1

        if [ $? -eq 0 ]; then
            echo -e "   ${GREEN}✅ App launched on $device${NC}"
        else
            echo -e "   ${YELLOW}⚠️  Could not launch app on $device (may still be starting)${NC}"
        fi
    fi
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "📱 The app should now be running on your device(s)."
echo "📝 To view logs, run:"
echo "   ${YELLOW}adb logcat | grep 'STT\|ReactNativeJS'${NC}"
echo ""
