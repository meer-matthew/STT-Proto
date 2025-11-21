import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { UserIcon } from '../components/icons/UserIcon';
import { ArrowIcon } from '../components/icons/ArrowIcon';
import { useTheme } from '../context/ThemeContext';
import { AppLayout } from '../components/AppLayout';
import Icon from 'react-native-vector-icons/FontAwesome';
import { authService } from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'Registration'>;

export function UserRegistration({ navigation }: Props) {
    const theme = useTheme();
    const styles = createStyles(theme);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userType, setUserType] = useState<'user' | 'caretaker'>('user');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        // Validation
        if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.register({
                username: username.trim(),
                email: email.trim(),
                password: password.trim(),
                user_type: userType,
            });

            // Registration successful, navigate directly to Conversation
            navigation.navigate('Conversation', { username: response.user.username });
        } catch (error: any) {
            console.error('Registration error:', error);
            Alert.alert('Registration Failed', error.message || 'Could not create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout showHeader={true} showHeaderBorder={false}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled">
                    <View style={styles.content}>
                        <UserIcon />
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.description}>
                            Sign up to get started
                        </Text>

                        {/* Username */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Username</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your username"
                                placeholderTextColor="#999"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isLoading}
                            />
                        </View>

                        {/* Email */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                                editable={!isLoading}
                            />
                        </View>

                        {/* User Type Selection */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>User Type</Text>
                            <View style={styles.userTypeContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.userTypeButton,
                                        userType === 'user' && styles.userTypeButtonActive,
                                    ]}
                                    onPress={() => setUserType('user')}
                                    disabled={isLoading}>
                                    <Icon
                                        name="user"
                                        size={20}
                                        color={userType === 'user' ? theme.colors.white : '#666'}
                                    />
                                    <Text
                                        style={[
                                            styles.userTypeText,
                                            userType === 'user' && styles.userTypeTextActive,
                                        ]}>
                                        User
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.userTypeButton,
                                        userType === 'caretaker' && styles.userTypeButtonActive,
                                    ]}
                                    onPress={() => setUserType('caretaker')}
                                    disabled={isLoading}>
                                    <Icon
                                        name="heart"
                                        size={20}
                                        color={userType === 'caretaker' ? theme.colors.white : '#666'}
                                    />
                                    <Text
                                        style={[
                                            styles.userTypeText,
                                            userType === 'caretaker' && styles.userTypeTextActive,
                                        ]}>
                                        Caretaker
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!isPasswordVisible}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                    disabled={isLoading}>
                                    <Icon
                                        name={isPasswordVisible ? 'eye' : 'eye-slash'}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Confirm your password"
                                    placeholderTextColor="#999"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!isConfirmPasswordVisible}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                                    disabled={isLoading}>
                                    <Icon
                                        name={isConfirmPasswordVisible ? 'eye' : 'eye-slash'}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || isLoading) &&
                                    styles.buttonDisabled,
                            ]}
                            onPress={handleRegister}
                            disabled={
                                !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || isLoading
                            }>
                            {isLoading ? (
                                <ActivityIndicator color={theme.colors.white} />
                            ) : (
                                <>
                                    <Text style={styles.buttonText}>Register</Text>
                                    <ArrowIcon />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Back to Login */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            disabled={isLoading}>
                            <Text style={styles.backButtonText}>
                                Already have an account?{' '}
                                <Text style={styles.backButtonTextBold}>Login</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </AppLayout>
    );
}

const createStyles = (theme: any) =>
    StyleSheet.create({
        flex: {
            flex: 1,
            backgroundColor: 'transparent',

        },
        scrollContent: {
            flexGrow: 1,
        },
        content: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.lg,
        },
        title: {
            fontSize: 28,
            fontWeight: '600',
            marginBottom: 4,
            color: theme.colors.text,
        },
        description: {
            fontSize: theme.fontSize.sm,
            textAlign: 'center',
            marginBottom: 24,
            color: '#666',
        },
        inputContainer: {
            width: '100%',
            marginBottom: theme.spacing.md,
        },
        label: {
            fontSize: theme.fontSize.sm,
            fontWeight: '500',
            marginBottom: theme.spacing.xs,
            color: theme.colors.text,
        },
        input: {
            width: '100%',
            height: 52,
            borderRadius: theme.borderRadius.sm,
            borderWidth: theme.borderWidth.thin,
            paddingHorizontal: theme.spacing.md,
            fontSize: 15,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.borderLight,
        },
        passwordContainer: {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            position: 'relative',
        },
        passwordInput: {
            flex: 1,
            height: 52,
            borderRadius: theme.borderRadius.sm,
            borderWidth: theme.borderWidth.thin,
            paddingHorizontal: theme.spacing.md,
            paddingRight: 50,
            fontSize: 15,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.borderLight,
        },
        eyeIcon: {
            position: 'absolute',
            right: 15,
            padding: theme.spacing.xs,
            justifyContent: 'center',
            alignItems: 'center',
        },
        userTypeContainer: {
            flexDirection: 'row',
            gap: theme.spacing.sm,
        },
        userTypeButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.xs,
            height: 52,
            borderRadius: theme.borderRadius.sm,
            borderWidth: theme.borderWidth.thin,
            borderColor: theme.colors.borderLight,
            backgroundColor: theme.colors.surface,
        },
        userTypeButtonActive: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        userTypeText: {
            fontSize: theme.fontSize.md,
            fontWeight: '500',
            color: '#666',
        },
        userTypeTextActive: {
            color: theme.colors.white,
        },
        button: {
            width: '100%',
            height: 52,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.sm,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            marginTop: theme.spacing.md,
        },
        buttonDisabled: {
            opacity: 0.5,
        },
        buttonText: {
            color: theme.colors.white,
            fontSize: theme.fontSize.md,
            fontWeight: '600',
            marginRight: theme.spacing.xs,
        },
        backButton: {
            marginTop: theme.spacing.lg,
        },
        backButtonText: {
            fontSize: theme.fontSize.sm,
            color: '#666',
            textAlign: 'center',
        },
        backButtonTextBold: {
            fontWeight: '600',
            color: theme.colors.primary,
        },
    });
