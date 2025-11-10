import { useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { authService } from '../services/authService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Hook to handle token expiration and redirect to welcome screen
 * Use this in screens that make API calls
 */
export function useTokenExpiration() {
    const navigation = useNavigation<NavigationProp>();

    const handleTokenExpired = useCallback(async () => {
        console.log('Token expired, redirecting to welcome screen');

        // Clear auth data
        await authService.clearAuth();

        // Reset navigation to Welcome
        navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
        });
    }, [navigation]);

    const handleAuthError = useCallback((error: any): boolean => {
        // Check if error is due to expired/invalid token
        const isAuthError =
            error?.message?.includes('Authentication expired') ||
            error?.message?.includes('Unauthorized') ||
            error?.message?.includes('401') ||
            error?.status === 401;

        if (isAuthError) {
            handleTokenExpired();
            return true;
        }
        return false;
    }, [handleTokenExpired]);

    return { handleTokenExpired, handleAuthError };
}