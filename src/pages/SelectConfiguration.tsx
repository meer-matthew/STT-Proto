import React, { useState } from 'react';
import {
    StatusBar,
    useColorScheme,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ConfigIcon } from '../components/icons/ConfigIcon';
import { configurationStyles } from '../styles/configurationStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectConfiguration'>;

type ConfigOption = {
    id: string;
    ratio: '1:1' | '2:1' | '3:1' | '1:2' | '2:2';
    title: string;
    description: string;
};

const configOptions: ConfigOption[] = [
    {
        id: '1',
        ratio: '1:1',
        title: '1 : 1',
        description: 'One caregiver, one user',
    },
    {
        id: '2',
        ratio: '2:1',
        title: '2 : 1',
        description: 'Two caregivers, one user',
    },
    {
        id: '3',
        ratio: '3:1',
        title: '3 : 1',
        description: 'Three caregivers, one user',
    },
    {
        id: '4',
        ratio: '1:2',
        title: '1 : 2',
        description: 'One caregiver, two users',
    },
    {
        id: '5',
        ratio: '2:2',
        title: '2 : 2',
        description: 'Two caregivers, two users',
    },
];

export function SelectConfigurationScreen({ navigation, route }: Props) {
    const isDarkMode = useColorScheme() === 'dark';
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
        <View
            style={[
                configurationStyles.container,
                { backgroundColor: isDarkMode ? '#000' : '#fff' },
            ]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <ScrollView
                contentContainerStyle={configurationStyles.scrollContainer}
                showsVerticalScrollIndicator={false}>
                <View style={configurationStyles.content}>
                    <Text style={[
                        configurationStyles.title,
                        { color: isDarkMode ? '#fff' : '#000' }
                    ]}>
                        Select Configuration
                    </Text>

                    <Text style={[
                        configurationStyles.description,
                        { color: isDarkMode ? '#8e8e93' : '#666' }
                    ]}>
                        Choose caregiver to user ratio
                    </Text>

                    <View style={configurationStyles.optionsContainer}>
                        {configOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    configurationStyles.optionCard,
                                    {
                                        backgroundColor: isDarkMode ? '#1c1c1e' : '#fff',
                                        borderColor: selectedConfig === option.id
                                            ? '#4a5568'
                                            : isDarkMode ? '#38383a' : '#e0e0e0',
                                        borderWidth: selectedConfig === option.id ? 2 : 1,
                                    },
                                ]}
                                onPress={() => handleConfigSelect(option.id)}
                                activeOpacity={0.7}>
                                <ConfigIcon type={option.ratio} />
                                <View style={configurationStyles.optionContent}>
                                    <Text style={[
                                        configurationStyles.optionRatio,
                                        { color: isDarkMode ? '#fff' : '#000' }
                                    ]}>
                                        {option.title}
                                    </Text>
                                    <Text style={[
                                        configurationStyles.optionDescription,
                                        { color: isDarkMode ? '#8e8e93' : '#666' }
                                    ]}>
                                        {option.description}
                                    </Text>
                                </View>
                                <Text style={[
                                    configurationStyles.arrowIcon,
                                    { color: isDarkMode ? '#8e8e93' : '#999' }
                                ]}>
                                    →
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[
                            configurationStyles.continueButton,
                            !selectedConfig && { opacity: 0.5 },
                        ]}
                        onPress={handleContinue}
                        disabled={!selectedConfig}
                        activeOpacity={0.7}>
                        <Text style={configurationStyles.continueButtonText}>
                            Continue
                        </Text>
                        <Text style={{ color: '#fff', fontSize: 18 }}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            configurationStyles.backButton,
                            { backgroundColor: isDarkMode ? '#1c1c1e' : '#f5f5f5' }
                        ]}
                        onPress={handleGoBack}
                        activeOpacity={0.7}>
                        <Text style={[
                            configurationStyles.backButtonText,
                            { color: isDarkMode ? '#fff' : '#000' }
                        ]}>
                            ← Back
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}
