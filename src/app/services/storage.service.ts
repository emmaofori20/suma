import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Entry, Settings, AppState } from '../models/entry.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly ENTRIES_KEY = 'suma_entries';
  private readonly SETTINGS_KEY = 'suma_settings';

  async getEntries(): Promise<Entry[]> {
    try {
      const { value } = await Preferences.get({ key: this.ENTRIES_KEY });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting entries:', error);
      return [];
    }
  }

  async saveEntry(entry: Entry): Promise<void> {
    try {
      const entries = await this.getEntries();
      
      // Add updatedAt if not present
      if (!entry.updatedAt) {
        entry.updatedAt = Date.now();
      }
      
      // Update existing entry or add new one
      const existingIndex = entries.findIndex(e => e.id === entry.id);
      if (existingIndex >= 0) {
        entries[existingIndex] = entry;
      } else {
        entries.push(entry);
      }
      
      await Preferences.set({
        key: this.ENTRIES_KEY,
        value: JSON.stringify(entries)
      });
    } catch (error) {
      console.error('Error saving entry:', error);
      throw error;
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      const entries = await this.getEntries();
      const filteredEntries = entries.filter(entry => entry.id !== id);
      await Preferences.set({
        key: this.ENTRIES_KEY,
        value: JSON.stringify(filteredEntries)
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  }

  async getSettings(): Promise<Settings> {
    try {
      const { value } = await Preferences.get({ key: this.SETTINGS_KEY });
      return value ? JSON.parse(value) : { 
        currency: '$', 
        weekStartsOn: 0, 
        theme: 'ocean',
        dailyReminder: false,
        reminderTime: '20:00',
        updatedAt: Date.now()
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return { 
        currency: '$', 
        weekStartsOn: 0, 
        theme: 'ocean',
        dailyReminder: false,
        reminderTime: '20:00',
        updatedAt: Date.now()
      };
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    try {
      await Preferences.set({
        key: this.SETTINGS_KEY,
        value: JSON.stringify(settings)
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  async exportToCSV(): Promise<string> {
    try {
      const entries = await this.getEntries();
      const settings = await this.getSettings();
      
      let csv = 'Date,Amount,Note,Tags\n';
      entries.forEach(entry => {
        const date = new Date(entry.ts).toLocaleDateString();
        const amount = `${settings.currency}${entry.amount.toFixed(2)}`;
        const note = entry.note || '';
        const tags = entry.tags ? entry.tags.join(';') : '';
        csv += `"${date}","${amount}","${note}","${tags}"\n`;
      });
      
      return csv;
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  }

  async exportToJSON(): Promise<AppState> {
    try {
      const entries = await this.getEntries();
      const settings = await this.getSettings();
      
      return {
        entries,
        settings,
        version: '1.0.0',
        exportDate: Date.now()
      };
    } catch (error) {
      console.error('Error exporting JSON:', error);
      throw error;
    }
  }

  async importFromJSON(appState: AppState): Promise<void> {
    try {
      // Validate schema
      if (!appState.entries || !appState.settings || !appState.version) {
        throw new Error('Invalid backup file format');
      }

      // Save entries
      await Preferences.set({
        key: this.ENTRIES_KEY,
        value: JSON.stringify(appState.entries)
      });

      // Save settings
      await Preferences.set({
        key: this.SETTINGS_KEY,
        value: JSON.stringify(appState.settings)
      });
    } catch (error) {
      console.error('Error importing JSON:', error);
      throw error;
    }
  }

  async getAllTags(): Promise<string[]> {
    try {
      const entries = await this.getEntries();
      const allTags: string[] = [];
      entries.forEach(entry => {
        if (entry.tags && entry.tags.length > 0) {
          allTags.push(...entry.tags);
        }
      });
      return [...new Set(allTags)].sort();
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  }
}
