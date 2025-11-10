import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { WelcomeScreen } from '../pages/WelcomeScreen';
import { UserRegistration } from '../pages/UserRegistration';
import { RoleSelectionScreen } from '../pages/RoleSelection';
import { SelectConfigurationScreen } from '../pages/SelectConfiguration';
import { ConversationOptions } from '../pages/ConversationOptions';
import { ConversationScreen } from '../pages/ConversationScreen';
import { authService } from '../services/authService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            // Verify token with backend
            const { valid, user } = await authService.verifyToken();

            if (valid && user) {
                setIsAuthenticated(true);
                setUsername(user.username);
            } else {
                setIsAuthenticated(false);
                setUsername(null);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setIsAuthenticated(false);
            setUsername(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading screen while checking authentication
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <Stack.Navigator
            initialRouteName={isAuthenticated && username ? 'Conversation' : 'Welcome'}
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}>
            {isAuthenticated && username ? (
                // Authenticated user flow - start at Conversation
                <>
                    <Stack.Screen
                        name="Conversation"
                        component={ConversationScreen}
                        initialParams={{ username }}
                    />
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen name="Registration" component={UserRegistration} />
                    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
                    <Stack.Screen name="SelectConfiguration" component={SelectConfigurationScreen} />
                    <Stack.Screen name="ConversationOptions" component={ConversationOptions} />
                </>
            ) : (
                // Unauthenticated user flow - start at Welcome
                <>
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen name="Registration" component={UserRegistration} />
                    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
                    <Stack.Screen name="SelectConfiguration" component={SelectConfigurationScreen} />
                    <Stack.Screen name="ConversationOptions" component={ConversationOptions} />
                    <Stack.Screen name="Conversation" component={ConversationScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});