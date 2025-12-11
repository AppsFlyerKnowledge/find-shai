import React from 'react';
import { View, Text, StyleSheet, SectionList, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Notification } from '../../../amplify/data/resource';
import { useStateContext } from '@/state/state';

// Section type for grouping notifications by date
interface NotificationSection {
  title: string;
  data: Notification[];
}

// Helper function to check if a date is today
const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Helper function to check if a date is yesterday
const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

// Sort notifications into sections: Today, Yesterday, Other
const sortNotifications = (notifications: Notification[]): NotificationSection[] => {
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const other: Notification[] = [];

  for (const notification of notifications) {
    const timestamp = new Date(notification.createdAt);
    
    if (isToday(timestamp)) {
      today.push(notification);
    } else if (isYesterday(timestamp)) {
      yesterday.push(notification);
    } else {
      other.push(notification);
    }
  }

  // Sort each group by timestamp (newest first)
  const sortByTime = (a: Notification, b: Notification) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

  today.sort(sortByTime);
  yesterday.sort(sortByTime);
  other.sort(sortByTime);

  // Build sections array, only including non-empty sections
  const sections: NotificationSection[] = [];
  
  if (today.length > 0) {
    sections.push({ title: 'Today', data: today });
  }
  if (yesterday.length > 0) {
    sections.push({ title: 'Yesterday', data: yesterday });
  }
  if (other.length > 0) {
    sections.push({ title: 'Earlier', data: other });
  }

  return sections;
};

// Format timestamp for display
const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${hours}:${minutes} (${day}/${month}/${year})`;
};

// Get icon details based on event type (ENTER/EXIT)
const getNotificationDetails = (eventType: string | undefined | null): { iconName: string; iconColor: string } => {
  // Handle undefined/null and normalize to uppercase for comparison
  const normalizedType = (eventType || '').toUpperCase().trim();
  
  if (normalizedType === 'ENTER') {
    return { iconName: 'ellipse', iconColor: '#4CAF50' }; // Green for enter
  } else {
    return { iconName: 'ellipse', iconColor: '#F44336' }; // Red for exit
  }
};

// Notification cell component
const NotificationCell = ({ notification }: { notification: Notification }) => {
  // Try both field names (snake_case and camelCase) and also check message content
  const eventType = notification.event_type || 
                    (notification as any).eventType ||
                    (notification.message?.toLowerCase().includes('entered') ? 'ENTER' : 
                     notification.message?.toLowerCase().includes('exited') ? 'EXIT' : '');
  
  const { iconName, iconColor } = getNotificationDetails(eventType);
  const timestamp = formatTimestamp(notification.createdAt);

  return (
    <View style={styles.notificationContainer}>
      <Icon name={iconName} size={12} color={iconColor} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
        <Text style={styles.notificationTimestamp}>{timestamp}</Text>
      </View>
    </View>
  );
};

// Section header component
const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const Notifications = () => {
  const { state } = useStateContext();
  const sections = sortNotifications(state.notifications);

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <Text style={styles.header}>Notifications</Text>
      
      {state.notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="notifications-off-outline" size={48} color="#999" />
          <Text style={styles.noNotificationsText}>No notifications available</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationCell notification={item} />}
          renderSectionHeader={({ section: { title } }) => (
            <SectionHeader title={title} />
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    marginTop: 10,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginTop: 10,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
    marginTop: 4,
  },
  textContainer: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
  },
  noNotificationsText: {
    fontSize: 18,
    color: '#777',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default Notifications;
