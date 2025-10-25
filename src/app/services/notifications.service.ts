import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StorageService } from './storage.service';
import { Settings } from '../models/entry.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private readonly REMINDER_ID = 1001;

  constructor(private storageService: StorageService) {}

  async requestPermission(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async scheduleDailyReminder(): Promise<void> {
    try {
      const settings = await this.storageService.getSettings();
      
      if (!settings) {
        console.warn('Settings not available');
        return;
      }
      
      if (!settings.dailyReminder) {
        await this.cancelDailyReminder();
        return;
      }

      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('Notification permission denied');
        return;
      }

      // Validate reminderTime format
      if (!settings.reminderTime || typeof settings.reminderTime !== 'string') {
        console.warn('Invalid reminder time format:', settings.reminderTime);
        return;
      }
      
      const timeParts = settings.reminderTime.split(':');
      if (timeParts.length !== 2) {
        console.warn('Invalid time format. Expected HH:MM, got:', settings.reminderTime);
        return;
      }
      
      const [hours, minutes] = timeParts.map(Number);
      
      // Validate hours and minutes
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn('Invalid time values. Hours:', hours, 'Minutes:', minutes);
        return;
      }
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.REMINDER_ID,
            title: 'Suma Reminder',
            body: 'Don\'t forget to log your daily expenses!',
            schedule: {
              on: {
                hour: hours,
                minute: minutes
              },
              repeats: true
            },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: undefined
          }
        ]
      });
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }

  async cancelDailyReminder(): Promise<void> {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: this.REMINDER_ID }]
      });
    } catch (error) {
      console.error('Error canceling daily reminder:', error);
    }
  }

  async updateReminderSettings(dailyReminder: boolean, reminderTime: string): Promise<void> {
    const settings = await this.storageService.getSettings();
    settings.dailyReminder = dailyReminder;
    settings.reminderTime = reminderTime;
    
    await this.storageService.saveSettings(settings);
    
    if (dailyReminder) {
      await this.scheduleDailyReminder();
    } else {
      await this.cancelDailyReminder();
    }
  }

  async scheduleBudgetWarning(notification: {
    id: number;
    title: string;
    body: string;
    schedule: { at: Date };
  }) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            schedule: notification.schedule,
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (error) {
      console.error('Error scheduling budget warning:', error);
    }
  }
}
