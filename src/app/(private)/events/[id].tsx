import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  getEventById,
  deleteEvent,
  getRecurrenceDescription,
  getNotificationDescription,
  type EventWithSchedules,
} from '@/app/lib/eventsApi';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [event, setEvent] = useState<EventWithSchedules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getEventById(id);

    if (fetchError) {
      setError(fetchError.message || 'Failed to load event');
      console.error('Error loading event:', fetchError);
    } else {
      setEvent(data);
    }

    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error: deleteError } = await deleteEvent(id);

            if (deleteError) {
              Alert.alert('Error', deleteError.message || 'Failed to delete event');
            } else {
              router.back();
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'bill':
        return '#3B82F6';
      case 'credit_card':
        return '#EF4444';
      case 'budget_review':
        return '#10B981';
      default:
        return '#6B7280';
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
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Event not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadEvent()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {/* Note: Edit functionality can be added later */}
          {/* <TouchableOpacity onPress={() => router.push(`/events/${id}/edit`)}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity> */}
          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteButton}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Event Type Badge */}
        <View
          style={[
            styles.eventTypeBadge,
            { backgroundColor: getEventTypeColor(event.event_type) },
          ]}
        >
          <Text style={styles.eventTypeBadgeText}>
            {getEventTypeLabel(event.event_type)}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{event.title}</Text>

        {/* Description */}
        {event.description && (
          <Text style={styles.description}>{event.description}</Text>
        )}

        {/* Due Date */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Due Date</Text>
          <Text style={styles.sectionValue}>{formatDate(event.due_date)}</Text>
        </View>

        {/* Recurrence */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recurrence</Text>
          <Text style={styles.sectionValue}>{getRecurrenceDescription(event)}</Text>
        </View>

        {/* Notification Schedules */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notification Times</Text>
          {event.notification_schedules.length === 0 ? (
            <Text style={styles.noSchedulesText}>No notifications configured</Text>
          ) : (
            event.notification_schedules.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleItem}>
                <Text style={styles.scheduleText}>
                  {getNotificationDescription(schedule)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Metadata */}
        <View style={styles.metadataSection}>
          <Text style={styles.metadataText}>
            Created {new Date(event.created_at).toLocaleDateString()}
          </Text>
          {event.updated_at !== event.created_at && (
            <Text style={styles.metadataText}>
              Updated {new Date(event.updated_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
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
  backButton: {
    fontSize: 16,
    color: '#3B82F6',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  editButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  deleteButton: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  eventTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 16,
  },
  eventTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '500',
  },
  noSchedulesText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  scheduleItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scheduleText: {
    fontSize: 16,
    color: '#111827',
  },
  metadataSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  metadataText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
});
