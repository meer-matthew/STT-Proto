import React, { useState, useRef } from 'react';
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
    Animated,
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
    const theme = useTheme();
    const styles = createStyles(theme);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<'username' | 'password' | null>(null);
    const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
    const [loginError, setLoginError] = useState<string | null>(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const validateForm = () => {
        const newErrors: { username?: string; password?: string } = {};

        if (!username.trim()) {
            newErrors.username = 'Username is required';
        } else if (username.trim().length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!password.trim()) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        setLoginError(null);

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        try {
            const response = await authService.login(username.trim(), password.trim());
            navigation.navigate('Conversation', { username: response.user.username });
        } catch (error: any) {
            console.error('Login error:', error);
            setLoginError(error.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUsernameChange = (text: string) => {
        setUsername(text);
        if (errors.username) {
            setErrors({ ...errors, username: undefined });
        }
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        if (errors.password) {
            setErrors({ ...errors, password: undefined });
        }
    };

    return (
        <AppLayout showHeader={true} showHeaderBorder={false}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.headerSection}>
                        <View style={styles.iconContainer}>
                            <Icon name="lock" size={32} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.title}>Login to your account</Text>
                        <Text style={styles.description}>
                            It's on the screen in front of you
                        </Text>
                    </View>

                    {/* Login Error Alert */}
                    {loginError && (
                        <View style={styles.errorAlert}>
                            <Icon name="exclamation-circle" size={16} color="#dc2626" />
                            <Text style={styles.errorAlertText}>{loginError}</Text>
                        </View>
                    )}

                    {/* Form Container */}
                    <View style={styles.formContainer}>
                        {/* Username Input */}
                        <View style={styles.fieldContainer}>
                            <View style={[
                                styles.inputWrapper,
                                focusedInput === 'username' && styles.inputWrapperFocused,
                                errors.username && styles.inputWrapperError
                            ]}>
                                <Icon
                                    name="user"
                                    size={18}
                                    color={focusedInput === 'username' ? theme.colors.primary : '#999'}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Username"
                                    placeholderTextColor="#999"
                                    value={username}
                                    onChangeText={handleUsernameChange}
                                    onFocus={() => setFocusedInput('username')}
                                    onBlur={() => setFocusedInput(null)}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                    cursorColor={theme.colors.primary}
                                />
                            </View>
                            {errors.username && (
                                <View style={styles.errorContainer}>
                                    <Icon name="info-circle" size={12} color="#dc2626" />
                                    <Text style={styles.errorText}>{errors.username}</Text>
                                </View>
                            )}
                        </View>

                        {/* Password Input */}
                        <View style={styles.fieldContainer}>
                            <View style={[
                                styles.inputWrapper,
                                focusedInput === 'password' && styles.inputWrapperFocused,
                                errors.password && styles.inputWrapperError
                            ]}>
                                <Icon
                                    name="lock"
                                    size={18}
                                    color={focusedInput === 'password' ? theme.colors.primary : '#999'}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={handlePasswordChange}
                                    onFocus={() => setFocusedInput('password')}
                                    onBlur={() => setFocusedInput(null)}
                                    secureTextEntry={!isPasswordVisible}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                    cursorColor={theme.colors.primary}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                    disabled={isLoading}
                                    activeOpacity={0.6}>
                                    <Icon
                                        name={isPasswordVisible ? 'eye' : 'eye-slash'}
                                        size={18}
                                        color={focusedInput === 'password' ? theme.colors.primary : '#999'}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password && (
                                <View style={styles.errorContainer}>
                                    <Icon name="info-circle" size={12} color="#dc2626" />
                                    <Text style={styles.errorText}>{errors.password}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Login Button */}
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                (!username.trim() || !password.trim() || isLoading) && styles.buttonDisabled,
                            ]}
                            onPress={handleLogin}
                            disabled={!username.trim() || !password.trim() || isLoading}
                            activeOpacity={0.85}>
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color={theme.colors.white} size="small" />
                                    <Text style={styles.buttonText}>Logging in...</Text>
                                </View>
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Text style={styles.buttonText}>Continue</Text>
                                    <Icon name="arrow-right" size={16} color={theme.colors.white} style={{ marginLeft: 8 }} />
                                </View>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
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
    headerSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${theme.colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        marginBottom: 12,
        color: theme.colors.text,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        color: '#888',
        fontWeight: '400',
        lineHeight: 24,
    },
    formContainer: {
        width: '100%',
        marginBottom: 32,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        borderWidth: 2,
        borderColor: '#F5F5F5',
        paddingHorizontal: theme.spacing.md,
        transition: 'all 0.3s ease',
    },
    inputWrapperFocused: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.white,
    },
    inputWrapperError: {
        borderColor: '#dc2626',
        backgroundColor: '#fef2f2',
    },
    inputIcon: {
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
        paddingVertical: theme.spacing.sm,
    },
    eyeIcon: {
        padding: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: theme.spacing.sm,
    },
    errorText: {
        fontSize: 12,
        color: '#dc2626',
        fontWeight: '500',
        marginLeft: 6,
    },
    errorAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
        padding: theme.spacing.md,
        marginBottom: 24,
    },
    errorAlertText: {
        fontSize: 14,
        color: '#dc2626',
        fontWeight: '500',
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    button: {
        width: '100%',
        height: 56,
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.md,
    },
    buttonText: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: '600',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
        position: 'relative',
    },
});