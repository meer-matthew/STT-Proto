import { StyleSheet } from 'react-native';

export const conversationStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    splitContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    conversationListPanel: {
        width: '25%',
        minWidth: 250,
        maxWidth: 350,
    },
    conversationPanel: {
        flex: 1,
        backgroundColor: '#fff',
    },
    conversationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    toggleButton: {
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 16,
    },
    messagesContainer: {
        paddingTop: 16,
        flex: 1,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyStateDescription: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
});