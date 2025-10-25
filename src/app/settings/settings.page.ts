import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton, 
  IonItem, 
  IonLabel, 
  IonList, 
  IonCard, 
  IonCardContent,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonDatetime,
  IonDatetimeButton,
  IonPopover
} from '@ionic/angular/standalone';
import { arrowBack, save, download, notifications, checkmark, refresh, cloudDownload, colorPalette, informationCircle, cash, calendar } from 'ionicons/icons';
import { StorageService } from '../services/storage.service';
import { Settings, AppState } from '../models/entry.model';
import { Router } from '@angular/router';
import { ThemeService } from '../services/theme.service';
import { NotificationsService } from '../services/notifications.service';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonItem,
    IonLabel,
    IonIcon,
    IonButtons,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonDatetime,
    IonDatetimeButton,
    IonPopover
  ]
})
export class SettingsPage implements OnInit {
  @ViewChild('reminderPopover') reminderPopover!: IonPopover;
  
  settings: Settings = { currency: '$', weekStartsOn: 0, theme: 'ocean', dailyReminder: false, reminderTime: '20:00' };
  originalSettings: Settings = { currency: '$', weekStartsOn: 0, theme: 'ocean', dailyReminder: false, reminderTime: '20:00' };
    @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  currencyOptions = [
    { value: '$', label: 'Dollar ($)' },
    { value: '€', label: 'Euro (€)' },
    { value: '£', label: 'Pound (£)' },
    { value: '¥', label: 'Yen (¥)' },
    { value: '₹', label: 'Rupee (₹)' },
    { value: '₽', label: 'Ruble (₽)' },
    { value: '₩', label: 'Won (₩)' },
    { value: '₪', label: 'Shekel (₪)' },
    { value: '₦', label: 'Naira (₦)' },
    { value: '₨', label: 'Rupee (₨)' },
    { value: '₵', label: 'Cedi (₵)' }
  ];

  weekStartOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' }
  ];

  themeOptions = [
    { value: 'ocean', label: 'Ocean', description: 'Calm blue and violet' },
    { value: 'mint', label: 'Mint', description: 'Fresh teal and mint' },
    { value: 'sunset', label: 'Sunset', description: 'Warm coral and orange' }
  ];

  constructor(
    private storageService: StorageService,
    private router: Router,
    private themeService: ThemeService,
    private notificationsService: NotificationsService
  ) {
    addIcons({ arrowBack, save, download, notifications, checkmark, refresh, cloudDownload, colorPalette, informationCircle, calendar, cash });
  }

  async ngOnInit() {
    await this.loadSettings();
  }

  async loadSettings() {
    this.settings = await this.storageService.getSettings();
    this.originalSettings = { ...this.settings };
  }

  async saveSettings() {
    try {
      await this.storageService.saveSettings(this.settings);
      this.originalSettings = { ...this.settings };
      // Show success message or navigate back
      this.goBack();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  hasChanges(): boolean {
    return this.settings.currency !== this.originalSettings.currency ||
           this.settings.weekStartsOn !== this.originalSettings.weekStartsOn ||
           this.settings.theme !== this.originalSettings.theme ||
           this.settings.dailyReminder !== this.originalSettings.dailyReminder ||
           this.settings.reminderTime !== this.originalSettings.reminderTime;
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  async resetToDefaults() {
    this.settings = { currency: '$', weekStartsOn: 0, theme: 'ocean', dailyReminder: false, reminderTime: '20:00' };
  }

  async onThemeChange() {
    await this.themeService.setTheme(this.settings.theme);
  }

  async onReminderToggle() {
    await this.notificationsService.updateReminderSettings(
      this.settings.dailyReminder, 
      this.settings.reminderTime
    );
  }
 

  async onReminderTimeChange() {
    console.log('Time changed to:', this.settings.reminderTime);
    
    // Format the time to HH:MM format if it's in ISO format
    if (this.settings.reminderTime && this.settings.reminderTime.includes('T')) {
      const date = new Date(this.settings.reminderTime);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      this.settings.reminderTime = `${hours}:${minutes}`;
      console.log('Formatted time to:', this.settings.reminderTime);
    }
    
    // Save the time change to storage immediately
    await this.storageService.saveSettings(this.settings);
    
    if (this.settings.dailyReminder) {
      await this.notificationsService.updateReminderSettings(
        this.settings.dailyReminder, 
        this.settings.reminderTime
      );
    }
  }

  async openReminderPopover() {
    if (this.reminderPopover) {
      await this.reminderPopover.present();
    }
  }

triggerFileInput() {
  this.fileInput.nativeElement.click();
}


  async exportJSON() {
    try {
      const appState = await this.storageService.exportToJSON();
      const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `suma-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  }

  async exportCSV() {
    try {
      const csv = await this.storageService.exportToCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `suma-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  }

  async importJSON(event: any) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const text = await file.text();
      const appState: AppState = JSON.parse(text);
      
      await this.storageService.importFromJSON(appState);
      await this.loadSettings();
      
      // Apply theme
      await this.themeService.setTheme(this.settings.theme);
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error importing JSON:', error);
      alert('Invalid backup file format');
    }
  }
}
