import { StyleSheet } from 'react-native';

export const configurationStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingVertical: 40,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
        color: '#666',
    },
    optionsContainer: {
        width: '100%',
        gap: 12,
        marginBottom: 24,
    },
    optionCard: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        backgroundColor: '#fff',
        borderColor: '#e0e0e0',
    },
    optionContent: {
        flex: 1,
    },
    optionRatio: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
        color: '#000',
    },
    optionDescription: {
        fontSize: 13,
        color: '#666',
    },
    arrowIcon: {
        fontSize: 18,
        color: '#999',
        marginLeft: 8,
    },
    continueButton: {
        width: '100%',
        height: 52,
        backgroundColor: '#4a5568',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: 8,
        marginBottom: 16,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    backButton: {
        width: '100%',
        height: 52,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
});