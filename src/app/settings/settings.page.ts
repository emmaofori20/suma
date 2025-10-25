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
  IonPopover, IonProgressBar } from '@ionic/angular/standalone';
import { arrowBack, save, download, notifications, checkmark, refresh, cloudDownload, colorPalette, informationCircle, cash, calendar } from 'ionicons/icons';
import { StorageService } from '../services/storage.service';
import { Settings, AppState, Budget } from '../models/entry.model';
import { Router } from '@angular/router';
import { ThemeService } from '../services/theme.service';
import { NotificationsService } from '../services/notifications.service';
import { SyncService } from '../services/sync.service';
import { BudgetService } from '../services/budget.service';
import { AppLockService } from '../services/app-lock.service';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  standalone: true,
  imports: [IonProgressBar, 
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
  
  settings: Settings = { currency: '$', weekStartsOn: 0, theme: 'ocean', dailyReminder: false, reminderTime: '20:00', updatedAt: Date.now() };
  originalSettings: Settings = { currency: '$', weekStartsOn: 0, theme: 'ocean', dailyReminder: false, reminderTime: '20:00', updatedAt: Date.now() };
  
  syncStatus: {
    enabled: boolean;
    lastSync?: number;
    userId?: string;
  } = {
    enabled: false,
    lastSync: undefined,
    userId: undefined
  };
  isSyncing = false;
  
  budget: Budget | null = null;
  budgetSpending = {
    spent: 0,
    budget: 0,
    remaining: 0,
    percentage: 0,
    isOverBudget: false
  };
  
  lockSettings = {
    enabled: false,
    biometricEnabled: false,
    biometricAvailable: false
  };
  newPin = '';
  confirmPin = '';
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
    private notificationsService: NotificationsService,
    private syncService: SyncService,
    private budgetService: BudgetService,
    private appLockService: AppLockService
  ) {
    addIcons({ arrowBack, save, download, notifications, checkmark, refresh, cloudDownload, colorPalette, informationCircle, calendar, cash });
  }

  async ngOnInit() {
    await this.loadSettings();
  }

  async loadSettings() {
    this.settings = await this.storageService.getSettings();
    this.originalSettings = { ...this.settings };
    this.syncStatus = await this.syncService.getSyncStatus();
    this.budget = await this.budgetService.getBudget();
    if (this.budget) {
      this.budgetSpending = await this.budgetService.getCurrentPeriodSpending();
    }
    this.lockSettings = await this.appLockService.getLockSettings();
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
    this.settings = { currency: '$', weekStartsOn: 0, theme: 'ocean', dailyReminder: false, reminderTime: '20:00', updatedAt: Date.now() };
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

  async toggleCloudSync() {
    try {
      if (this.syncStatus.enabled) {
        await this.syncService.disableSync();
      } else {
        await this.syncService.enableSync();
      }
      await this.loadSettings();
    } catch (error) {
      console.error('Error toggling cloud sync:', error);
      alert('Failed to toggle cloud sync. Please try again.');
    }
  }

  async syncNow() {
    if (this.isSyncing) return;
    
    try {
      this.isSyncing = true;
      const result = await this.syncService.syncNow();
      
      let message = 'Sync completed successfully!';
      if (result.entriesPushed > 0 || result.entriesPulled > 0) {
        message += `\n\n• ${result.entriesPushed} entries pushed to cloud\n• ${result.entriesPulled} entries pulled from cloud`;
      }
      if (result.settingsSynced) {
        message += '\n• Settings synchronized';
      }
      
      alert(message);
      await this.loadSettings();
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please check your internet connection and try again.');
    } finally {
      this.isSyncing = false;
    }
  }

  formatLastSync(lastSync?: number): string {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    return date.toLocaleString();
  }

  async saveBudget() {
    if (this.budget) {
      await this.budgetService.setBudget(this.budget);
      this.budgetSpending = await this.budgetService.getCurrentPeriodSpending();
    }
  }

  async deleteBudget() {
    this.budget = null;
    const settings = await this.storageService.getSettings();
    settings.budget = undefined;
    settings.updatedAt = Date.now();
    await this.storageService.saveSettings(settings);
  }

  formatAmount(amount: number): string {
    return `${this.settings.currency}${amount.toFixed(2)}`;
  }

  async setupPin() {
    if (this.newPin !== this.confirmPin) {
      alert('PINs do not match. Please try again.');
      return;
    }
    
    if (this.newPin.length < 4 || this.newPin.length > 6) {
      alert('PIN must be 4-6 digits.');
      return;
    }
    
    try {
      await this.appLockService.enablePinLock(this.newPin);
      this.newPin = '';
      this.confirmPin = '';
      await this.loadSettings();
      alert('PIN lock enabled successfully!');
    } catch (error) {
      console.error('Failed to setup PIN:', error);
      alert('Failed to setup PIN. Please try again.');
    }
  }

  async toggleBiometric() {
    try {
      if (this.lockSettings.biometricEnabled) {
        await this.appLockService.disableBiometric();
      } else {
        await this.appLockService.enableBiometric();
      }
      await this.loadSettings();
    } catch (error) {
      console.error('Failed to toggle biometric:', error);
      alert('Failed to toggle biometric authentication. Please try again.');
    }
  }

  async disableAppLock() {
    if (confirm('Are you sure you want to disable app lock? This will remove all security settings.')) {
      try {
        await this.appLockService.disableLock();
        await this.loadSettings();
        alert('App lock disabled successfully.');
      } catch (error) {
        console.error('Failed to disable app lock:', error);
        alert('Failed to disable app lock. Please try again.');
      }
    }
  }
}
