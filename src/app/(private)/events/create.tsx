import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  createEvent,
  formatDateForDB,
  formatTimeForDB,
  type EventType,
  type RecurrenceType,
  type CreateNotificationScheduleData,
} from '@/app/lib/eventsApi';

export default function CreateEventScreen() {
  const router = useRouter();

  // Event fields
  const [eventType, setEventType] = useState<EventType>('bill');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('monthly');
  const [recurrenceInterval, setRecurrenceInterval] = useState('30');

  // Notification schedules
  const [notificationSchedules, setNotificationSchedules] = useState<
    Array<{ days_before: number; time: Date }>
  >([{ days_before: 0, time: new Date(0, 0, 0, 9, 0) }]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (recurrenceType === 'custom' && (!recurrenceInterval || parseInt(recurrenceInterval) <= 0)) {
      Alert.alert('Error', 'Please enter a valid recurrence interval');
      return;
    }

    setLoading(true);

    try {
      const schedules: CreateNotificationScheduleData[] = notificationSchedules.map(
        (schedule) => ({
          days_before: schedule.days_before,
          notification_time: formatTimeForDB(schedule.time),
        })
      );

      const { data, error } = await createEvent(
        {
          event_type: eventType,
          title: title.trim(),
          description: description.trim() || undefined,
          due_date: formatDateForDB(dueDate),
          recurrence_type: recurrenceType,
          recurrence_interval:
            recurrenceType === 'custom' ? parseInt(recurrenceInterval) : undefined,
        },
        schedules
      );

      if (error) {
        Alert.alert('Error', error.message || 'Failed to create event');
        console.error('Error creating event:', error);
      } else {
        Alert.alert('Success', 'Reminder created successfully');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNotificationSchedule = () => {
    setNotificationSchedules([
      ...notificationSchedules,
      { days_before: 1, time: new Date(0, 0, 0, 9, 0) },
    ]);
  };

  const removeNotificationSchedule = (index: number) => {
    if (notificationSchedules.length > 1) {
      setNotificationSchedules(notificationSchedules.filter((_, i) => i !== index));
    } else {
      Alert.alert('Error', 'You must have at least one notification time');
    }
  };

  const updateNotificationDaysBefore = (index: number, days: string) => {
    const updated = [...notificationSchedules];
    updated[index].days_before = parseInt(days) || 0;
    setNotificationSchedules(updated);
  };

  const updateNotificationTime = (index: number, date: Date) => {
    const updated = [...notificationSchedules];
    updated[index].time = date;
    setNotificationSchedules(updated);
    setEditingTimeIndex(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Reminder</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {/* Event Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.segmentedControl}>
            {(['bill', 'credit_card', 'budget_review'] as EventType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.segmentButton,
                  eventType === type && styles.segmentButtonActive,
                ]}
                onPress={() => setEventType(type)}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    eventType === type && styles.segmentButtonTextActive,
                  ]}
                >
                  {type === 'bill' ? 'Bill' : type === 'credit_card' ? 'Card' : 'Review'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Rent payment, Chase card due"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Optional notes"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Due Date *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {dueDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) setDueDate(selectedDate);
              }}
            />
          )}
        </View>

        {/* Recurrence */}
        <View style={styles.section}>
          <Text style={styles.label}>Recurrence *</Text>
          <View style={styles.recurrenceOptions}>
            {(['monthly', 'weekly', 'custom', 'one_time'] as RecurrenceType[]).map(
              (type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.recurrenceButton,
                    recurrenceType === type && styles.recurrenceButtonActive,
                  ]}
                  onPress={() => setRecurrenceType(type)}
                >
                  <Text
                    style={[
                      styles.recurrenceButtonText,
                      recurrenceType === type && styles.recurrenceButtonTextActive,
                    ]}
                  >
                    {type === 'monthly'
                      ? 'Monthly'
                      : type === 'weekly'
                      ? 'Weekly'
                      : type === 'custom'
                      ? 'Custom'
                      : 'One Time'}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {recurrenceType === 'custom' && (
            <View style={styles.customIntervalContainer}>
              <Text style={styles.customIntervalLabel}>Every</Text>
              <TextInput
                style={styles.customIntervalInput}
                value={recurrenceInterval}
                onChangeText={setRecurrenceInterval}
                keyboardType="number-pad"
                placeholder="30"
              />
              <Text style={styles.customIntervalLabel}>days</Text>
            </View>
          )}
        </View>

        {/* Notification Schedules */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Notification Times *</Text>
            <TouchableOpacity onPress={addNotificationSchedule}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {notificationSchedules.map((schedule, index) => (
            <View key={index} style={styles.notificationSchedule}>
              <View style={styles.daysBeforeContainer}>
                <TextInput
                  style={styles.daysBeforeInput}
                  value={schedule.days_before.toString()}
                  onChangeText={(text) => updateNotificationDaysBefore(index, text)}
                  keyboardType="number-pad"
                  placeholder="0"
                />
                <Text style={styles.daysBeforeLabel}>
                  {schedule.days_before === 0
                    ? 'on the day'
                    : schedule.days_before === 1
                    ? 'day before'
                    : 'days before'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setEditingTimeIndex(index)}
              >
                <Text style={styles.timeButtonText}>
                  at{' '}
                  {schedule.time.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </TouchableOpacity>

              {editingTimeIndex === index && (
                <DateTimePicker
                  value={schedule.time}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedTime) => {
                    if (selectedTime) updateNotificationTime(index, selectedTime);
                  }}
                />
              )}

              {notificationSchedules.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeNotificationSchedule(index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  segmentButtonActive: {
    backgroundColor: '#3B82F6',
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  recurrenceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  recurrenceButton: {
    flex: 1,
    minWidth: '48%',
    margin: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  recurrenceButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  recurrenceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  recurrenceButtonTextActive: {
    color: '#FFFFFF',
  },
  customIntervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  customIntervalLabel: {
    fontSize: 16,
    color: '#111827',
    marginHorizontal: 8,
  },
  customIntervalInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
  },
  addButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  notificationSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 8,
  },
  daysBeforeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  daysBeforeInput: {
    width: 50,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
  },
  daysBeforeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginLeft: 8,
  },
  timeButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  removeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 28,
    color: '#EF4444',
    fontWeight: '300',
  },
});
