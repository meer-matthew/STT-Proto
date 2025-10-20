import React, { useState } from 'react';
import {
    useColorScheme,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { UserIcon } from '../components/icons/UserIcon';
import { ArrowIcon } from '../components/icons/ArrowIcon';
import { useTheme } from '../context/ThemeContext';
import { AppLayout } from '../components/AppLayout';
import Icon from 'react-native-vector-icons/FontAwesome';
import { authService } from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
    // const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();
    const styles = createStyles(theme);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter both username and password');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.login(username.trim(), password.trim());

            // Login successful, navigate directly to Conversation
            navigation.navigate('Conversation', { username: response.user.username });
        } catch (error: any) {
            console.error('Login error:', error);
            Alert.alert('Login Failed', error.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout showHeader={true} showHeaderBorder={false}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}>
                <View style={styles.content}>
                <UserIcon />
                <Text style={styles.title}>
                    Login
                </Text>

                <Text style={styles.description}>
                    Please enter your credentials to access your account
                </Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                        Username
                    </Text>
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

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                        Password
                    </Text>
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

                <TouchableOpacity
                    style={[
                        styles.button,
                        (!username.trim() || !password.trim() || isLoading) && styles.buttonDisabled,
                    ]}
                    onPress={handleLogin}
                    disabled={!username.trim() || !password.trim() || isLoading}>
                    {isLoading ? (
                        <ActivityIndicator color={theme.colors.white} />
                    ) : (
                        <>
                            <Text style={styles.buttonText}>Login</Text>
                            <ArrowIcon />
                        </>
                    )}
                </TouchableOpacity>

                {/* Registration Link */}
                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => navigation.navigate('Registration')}
                    disabled={isLoading}>
                    <Text style={styles.registerButtonText}>
                        Don't have an account?{' '}
                        <Text style={styles.registerButtonTextBold}>Sign Up</Text>
                    </Text>
                </TouchableOpacity>
            </View>
            </KeyboardAvoidingView>
        </AppLayout>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.white,
    },
    flex: {
        flex: 1,
        backgroundColor: theme.colors.white,

    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 4,
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: 28,
        fontWeight: '600',
        marginBottom: theme.spacing.md,
        color: theme.colors.text,
    },
    description: {
        fontSize: theme.fontSize.sm,
        textAlign: 'center',
        marginBottom: 32,
        color: '#666',
    },
    inputContainer: {
        width: '100%',
        marginBottom: theme.spacing.xl,
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
    button: {
        width: '100%',
        height: 52,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
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
    registerButton: {
        marginTop: theme.spacing.lg,
    },
    registerButtonText: {
        fontSize: theme.fontSize.sm,
        color: '#666',
        textAlign: 'center',
    },
    registerButtonTextBold: {
        fontWeight: '600',
        color: theme.colors.primary,
    },
});