import { StyleSheet } from 'react-native';

export const welcomeStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 16,
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 52,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 15,
    },
    button: {
        width: '100%',
        height: 52,
        backgroundColor: '#4a5568',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    buttonDisabled: {
        backgroundColor: '#4a556880',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
});