import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { WelcomeScreen } from '../pages/WelcomeScreen';
import { RoleSelectionScreen } from '../pages/RoleSelection';
import { SelectConfigurationScreen } from '../pages/SelectConfiguration';
import { ConversationOptions } from '../pages/ConversationOptions';
import { ConversationScreen } from '../pages/ConversationScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="SelectConfiguration" component={SelectConfigurationScreen} />
            <Stack.Screen name="ConversationOptions" component={ConversationOptions} />
            <Stack.Screen name="Conversation" component={ConversationScreen} />
        </Stack.Navigator>
    );
}