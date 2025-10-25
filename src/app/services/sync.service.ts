import { Injectable } from '@angular/core';
import { SyncProvider } from './sync-provider.interface';
import { FirebaseAdapterService } from './firebase-adapter.service';
import { StorageService } from './storage.service';
import { Entry, Settings } from '../models/entry.model';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private syncProvider: SyncProvider;
  private syncInterval: any;
  private readonly SYNC_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

  constructor(
    private firebaseAdapter: FirebaseAdapterService,
    private storageService: StorageService
  ) {
    this.syncProvider = firebaseAdapter;
  }

  async enableSync(): Promise<void> {
    try {
      // Sign in anonymously
      const { uid } = await this.syncProvider.signInAnon();
      
      // Update settings with sync info
      const settings = await this.storageService.getSettings();
      settings.cloudSync = {
        enabled: true,
        userId: uid,
        lastSync: Date.now()
      };
      settings.updatedAt = Date.now();
      
      await this.storageService.saveSettings(settings);
      
      // Start auto-sync
      this.startAutoSync();
      
      console.log('Cloud sync enabled successfully');
    } catch (error) {
      console.error('Failed to enable sync:', error);
      throw error;
    }
  }

  async disableSync(): Promise<void> {
    try {
      // Stop auto-sync
      this.stopAutoSync();
      
      // Update settings
      const settings = await this.storageService.getSettings();
      settings.cloudSync = {
        enabled: false,
        lastSync: settings.cloudSync?.lastSync
      };
      settings.updatedAt = Date.now();
      
      await this.storageService.saveSettings(settings);
      
      console.log('Cloud sync disabled');
    } catch (error) {
      console.error('Failed to disable sync:', error);
      throw error;
    }
  }

  async syncNow(): Promise<{ entriesPushed: number; entriesPulled: number; settingsSynced: boolean }> {
    try {
      const settings = await this.storageService.getSettings();
      if (!settings.cloudSync?.enabled) {
        throw new Error('Cloud sync is not enabled');
      }

      let entriesPushed = 0;
      let entriesPulled = 0;
      let settingsSynced = false;

      // Pull entries from server
      const lastSync = settings.cloudSync.lastSync || 0;
      const serverEntries = await this.syncProvider.pullEntries(lastSync);
      
      if (serverEntries.length > 0) {
        // Merge with local entries (LWW strategy)
        const localEntries = await this.storageService.getEntries();
        const mergedEntries = this.mergeEntries(localEntries, serverEntries);
        
        // Save merged entries
        for (const entry of mergedEntries) {
          await this.storageService.saveEntry(entry);
        }
        
        entriesPulled = serverEntries.length;
      }

      // Push local entries to server
      const localEntries = await this.storageService.getEntries();
      const entriesToPush = localEntries.filter(entry => 
        entry.updatedAt > (settings.cloudSync?.lastSync || 0)
      );
      
      if (entriesToPush.length > 0) {
        await this.syncProvider.upsertEntries(entriesToPush);
        entriesPushed = entriesToPush.length;
      }

      // Sync settings
      const serverSettings = await this.syncProvider.pullSettings();
      if (serverSettings && serverSettings.updatedAt > settings.updatedAt) {
        // Server settings are newer, use them
        await this.storageService.saveSettings(serverSettings);
        settingsSynced = true;
      } else if (settings.updatedAt > (serverSettings?.updatedAt || 0)) {
        // Local settings are newer, push them
        await this.syncProvider.upsertSettings(settings);
        settingsSynced = true;
      }

      // Update last sync time
      settings.cloudSync.lastSync = Date.now();
      settings.updatedAt = Date.now();
      await this.storageService.saveSettings(settings);

      return { entriesPushed, entriesPulled, settingsSynced };
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  private mergeEntries(localEntries: Entry[], serverEntries: Entry[]): Entry[] {
    const merged = new Map<string, Entry>();
    
    // Add local entries
    localEntries.forEach(entry => merged.set(entry.id, entry));
    
    // Merge server entries (LWW strategy)
    serverEntries.forEach(serverEntry => {
      const localEntry = merged.get(serverEntry.id);
      
      if (!localEntry || serverEntry.updatedAt > localEntry.updatedAt) {
        merged.set(serverEntry.id, serverEntry);
      }
    });
    
    return Array.from(merged.values());
  }

  private startAutoSync(): void {
    this.stopAutoSync(); // Clear any existing interval
    
    this.syncInterval = setInterval(async () => {
      try {
        const settings = await this.storageService.getSettings();
        if (settings.cloudSync?.enabled) {
          await this.syncNow();
          console.log('Auto-sync completed');
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, this.SYNC_INTERVAL_MS);
  }

  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async getSyncStatus(): Promise<{
    enabled: boolean;
    lastSync?: number;
    userId?: string;
  }> {
    const settings = await this.storageService.getSettings();
    return {
      enabled: settings.cloudSync?.enabled || false,
      lastSync: settings.cloudSync?.lastSync,
      userId: settings.cloudSync?.userId
    };
  }
}
