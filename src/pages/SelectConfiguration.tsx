import React, { useState } from 'react';
import {
    useColorScheme,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { AppLayout } from '../components/AppLayout';
import Icon from 'react-native-vector-icons/FontAwesome';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectConfiguration'>;

type ConfigOption = {
    id: string;
    ratio: '1:1' | '2:1' | '3:1' | '1:2' | '2:2';
    title: string;
    description: string;
    caretakers: number;
    users: number;
};

const configOptions: ConfigOption[] = [
    {
        id: '1',
        ratio: '1:1',
        title: '1 : 1',
        description: 'One caretaker, one user',
        caretakers: 1,
        users: 1,
    },
    {
        id: '2',
        ratio: '2:1',
        title: '2 : 1',
        description: 'Two caretakers, one user',
        caretakers: 2,
        users: 1,
    },
    {
        id: '3',
        ratio: '3:1',
        title: '3 : 1',
        description: 'Three caretakers, one user',
        caretakers: 3,
        users: 1,
    },
    {
        id: '4',
        ratio: '1:2',
        title: '1 : 2',
        description: 'One caretaker, two users',
        caretakers: 1,
        users: 2,
    },
    {
        id: '5',
        ratio: '2:2',
        title: '2 : 2',
        description: 'Two caretakers, two users',
        caretakers: 2,
        users: 2,
    },
];

export function SelectConfigurationScreen({ navigation, route }: Props) {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();
    const styles = createStyles(theme);
    const { username } = route.params;
    const [selectedConfig, setSelectedConfig] = useState<string | null>(null);

    const handleConfigSelect = (configId: string) => {
        setSelectedConfig(configId);
    };
    const handleContinue = () => {
        if (selectedConfig) {
            const config = configOptions.find(opt => opt.id === selectedConfig);
            navigation.navigate('Conversation', {
                username,
                configuration: config?.ratio || '1:1'
            });
        }
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <AppLayout showHeader={true} showHeaderBorder={false}>
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.headerSection}>
                        <Text style={styles.title}>
                            Select Meeting Setup
                        </Text>
                        <Text style={styles.description}>
                            Choose caregiver to user ratio
                        </Text>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.optionsContainer}
                        showsVerticalScrollIndicator={false}>
                        {configOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionCard,
                                    selectedConfig === option.id && styles.optionCardSelected,
                                ]}
                                onPress={() => handleConfigSelect(option.id)}
                                activeOpacity={0.7}>
                                <View style={styles.cardContent}>
                                    {/* Ratio Title */}
                                    <Text style={styles.optionRatio}>
                                        {option.title}
                                    </Text>

                                    {/* Visual Representation */}
                                    <View style={styles.visualContainer}>
                                        {/* Caretakers */}
                                        <View style={styles.roleGroup}>
                                            <View style={styles.iconRow}>
                                                {Array.from({ length: option.caretakers }).map((_, i) => (
                                                    <Icon
                                                        key={`caretaker-${i}`}
                                                        name="user-md"
                                                        size={24}
                                                        color={theme.colors.primary}
                                                        style={styles.personIcon}
                                                    />
                                                ))}
                                            </View>
                                            <Text style={styles.roleLabel}>
                                                Caretaker{option.caretakers > 1 ? 's' : ''}
                                            </Text>
                                        </View>

                                        {/* Separator */}
                                        <View style={styles.separator}>
                                            <View style={styles.separatorLine} />
                                        </View>

                                        {/* Users */}
                                        <View style={styles.roleGroup}>
                                            <View style={styles.iconRow}>
                                                {Array.from({ length: option.users }).map((_, i) => (
                                                    <Icon
                                                        key={`user-${i}`}
                                                        name="user"
                                                        size={24}
                                                        color="#666"
                                                        style={styles.personIcon}
                                                    />
                                                ))}
                                            </View>
                                            <Text style={styles.roleLabel}>
                                                User{option.users > 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Description */}
                                    <Text style={styles.optionDescription}>
                                        {option.description}
                                    </Text>

                                    {/* Check mark for selected */}
                                    {selectedConfig === option.id && (
                                        <View style={styles.checkmarkContainer}>
                                            <Icon name="check-circle" size={24} color={theme.colors.primary} />
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.buttonSection}>
                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                !selectedConfig && { opacity: 0.5 },
                            ]}
                            onPress={handleContinue}
                            disabled={!selectedConfig}
                            activeOpacity={0.7}>
                            <Text style={styles.continueButtonText}>
                                Continue
                            </Text>
                            <Text style={{ color: '#fff', fontSize: 18 }}>→</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleGoBack}
                            activeOpacity={0.7}>
                            <Text style={styles.backButtonText}>
                                ← Back
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </AppLayout>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.white,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
    },
    headerSection: {
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        color: theme.colors.text,
    },
    description: {
        fontSize: theme.fontSize.md,
        textAlign: 'center',
        color: '#666',
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    optionsContainer: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingBottom: theme.spacing.md,
    },
    optionCard: {
        width: '100%',
        maxWidth: 500,
        borderRadius: theme.borderRadius.md,
        borderWidth: 2,
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.borderLight,
        overflow: 'hidden',
        position: 'relative',
    },
    optionCardSelected: {
        borderColor: theme.colors.primary,
        borderWidth: 3,
        backgroundColor: '#f0f9ff',
    },
    cardContent: {
        padding: theme.spacing.lg,
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    optionRatio: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    visualContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        width: '100%',
    },
    roleGroup: {
        alignItems: 'center',
        gap: theme.spacing.xs,
        flex: 1,
    },
    iconRow: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    personIcon: {
        marginHorizontal: 2,
    },
    roleLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
        marginTop: theme.spacing.xs,
    },
    separator: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    separatorLine: {
        width: 2,
        height: 40,
        backgroundColor: theme.colors.borderLight,
    },
    optionDescription: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: theme.spacing.xs,
    },
    checkmarkContainer: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
    },
    buttonSection: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    continueButton: {
        width: '100%',
        maxWidth: 500,
        height: 52,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    continueButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.lg,
        fontWeight: '700',
        marginRight: theme.spacing.xs,
    },
    backButton: {
        width: '100%',
        maxWidth: 500,
        height: 48,
        borderRadius: theme.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    backButtonText: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        color: '#666',
    },
});
