import { StyleSheet } from 'react-native';

export const roleSelectionStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    rolesContainer: {
        width: '100%',
        gap: 16,
        marginBottom: 24,
    },
    roleCard: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        position: 'relative',
    },
    roleTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
    },
    roleDescription: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
    arrowContainer: {
        position: 'absolute',
        bottom: 20,
        right: 24,
    },
    arrow: {
        fontSize: 18,
    },
    backButton: {
        width: '100%',
        height: 52,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
});