import React, { useState } from 'react';
import {
    StatusBar,
    useColorScheme,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { UserIcon } from '../components/icons/UserIcon';
import { ArrowIcon } from '../components/icons/ArrowIcon';
import { welcomeStyles } from '../styles/welcomeStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
    const isDarkMode = useColorScheme() === 'dark';
    const [username, setUsername] = useState('');

    const handleContinue = () => {
        if (username.trim()) {
            navigation.navigate('RoleSelection', { username: username.trim() });
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[
                welcomeStyles.container,
                { backgroundColor: isDarkMode ? '#000' : '#fff' },
            ]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <View style={welcomeStyles.content}>
                <UserIcon />

                <Text style={[welcomeStyles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
                    Hello!
                </Text>
                <Text style={[welcomeStyles.subtitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                    Let's get started
                </Text>

                <Text style={[welcomeStyles.description, { color: isDarkMode ? '#8e8e93' : '#666' }]}>
                    Please enter your name below to continue
                </Text>

                <View style={welcomeStyles.inputContainer}>
                    <Text style={[welcomeStyles.label, { color: isDarkMode ? '#fff' : '#000' }]}>
                        Your Name
                    </Text>
                    <TextInput
                        style={[
                            welcomeStyles.input,
                            {
                                backgroundColor: isDarkMode ? '#1c1c1e' : '#f5f5f5',
                                color: isDarkMode ? '#fff' : '#000',
                                borderColor: isDarkMode ? '#38383a' : '#e0e0e0',
                            },
                        ]}
                        placeholder="Enter your name here"
                        placeholderTextColor={isDarkMode ? '#8e8e93' : '#999'}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="words"
                        autoCorrect={false}
                    />
                </View>

                <TouchableOpacity
                    style={[
                        welcomeStyles.button,
                        !username.trim() && welcomeStyles.buttonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={!username.trim()}>
                    <Text style={welcomeStyles.buttonText}>Continue</Text>
                    <ArrowIcon />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}