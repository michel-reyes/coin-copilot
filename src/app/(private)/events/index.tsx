import { useSession } from '@/context/authContext';
import { useNotifications } from '@/hooks/useNotifications';
import { type Event } from '@/lib/eventsApi';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function EventsListScreen() {
    const router = useRouter();
    const { expoPushToken } = useNotifications();
    const { signOut } = useSession();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async (isRefreshing = false) => {
        if (!isRefreshing) {
            setLoading(true);
        }
        setError(null);

        setLoading(false);
        setRefreshing(false);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadEvents(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getEventTypeColor = (eventType: string) => {
        switch (eventType) {
            case 'bill':
                return '#3B82F6'; // Blue
            case 'credit_card':
                return '#EF4444'; // Red
            case 'budget_review':
                return '#10B981'; // Green
            default:
                return '#6B7280'; // Gray
        }
    };

    const getEventTypeLabel = (eventType: string) => {
        switch (eventType) {
            case 'bill':
                return 'Bill';
            case 'credit_card':
                return 'Credit Card';
            case 'budget_review':
                return 'Budget Review';
            default:
                return eventType;
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size='large' color='#3B82F6' />
                <Text style={styles.loadingText}>Loading events...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => loadEvents()}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Reminders</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => router.push('/events/create')}
                >
                    <Text style={styles.createButtonText}>+ New</Text>
                </TouchableOpacity>
            </View>

            <View>
                <Button title='Sign Out' onPress={signOut} />
            </View>

            {expoPushToken && (
                <View>
                    <Text>Expo Push Token: {expoPushToken}</Text>
                </View>
            )}

            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No reminders yet</Text>
                <Text style={styles.emptySubtext}>
                    Create your first reminder for bills, credit cards, or
                    budget reviews
                </Text>
                <TouchableOpacity
                    style={styles.createFirstButton}
                    onPress={() => router.push('/events/create')}
                >
                    <Text style={styles.createFirstButtonText}>
                        Create Reminder
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    createButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    eventCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    eventTypeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    eventTypeBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    eventDate: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    eventDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
        lineHeight: 20,
    },
    eventRecurrence: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    createFirstButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createFirstButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
