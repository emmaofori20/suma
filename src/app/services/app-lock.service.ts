import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';
import { NativeBiometric } from 'capacitor-native-biometric';
import { StorageService } from './storage.service';
import { hashPin, generateSalt, validatePin } from '../utils/pin.util';

@Injectable({
  providedIn: 'root'
})
export class AppLockService {
  private readonly PIN_SALT_KEY = 'suma_pin_salt';
  private readonly LOCK_ENABLED_KEY = 'suma_lock_enabled';

  constructor(private storageService: StorageService) { }
  async isLockEnabled(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: this.LOCK_ENABLED_KEY });
      return value === 'true';
    } catch (error) {
      console.error('Error checking lock status:', error);
      return false;
    }
  }

  async enablePinLock(pin: string): Promise<void> {
    if (!validatePin(pin)) {
      throw new Error('PIN must be 4-6 digits');
    }

    try {
      const salt = generateSalt();
      const pinHash = hashPin(pin, salt);

      // Store salt and hash
      await Preferences.set({ key: this.PIN_SALT_KEY, value: salt });
      await Preferences.set({ key: this.LOCK_ENABLED_KEY, value: 'true' });

      // Update settings
      const settings = await this.storageService.getSettings();
      settings.appLock = {
        enabled: true,
        pinHash,
        biometricEnabled: settings.appLock?.biometricEnabled || false
      };
      settings.updatedAt = Date.now();
      await this.storageService.saveSettings(settings);

      console.log('PIN lock enabled');
    } catch (error) {
      console.error('Failed to enable PIN lock:', error);
      throw error;
    }
  }

  async verifyPin(pin: string): Promise<boolean> {
    try {
      const { value: salt } = await Preferences.get({ key: this.PIN_SALT_KEY });
      if (!salt) {
        throw new Error('No PIN salt found');
      }

      const storedHash = await this.getStoredPinHash();
      const inputHash = hashPin(pin, salt);

      return storedHash === inputHash;
    } catch (error) {
      console.error('PIN verification failed:', error);
      return false;
    }
  }

  async isBiometricAvailable(): Promise<boolean> {
    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  async enableBiometric(): Promise<void> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication not available');
      }

      // Update settings
      const settings = await this.storageService.getSettings();
      if (!settings.appLock) {
        throw new Error('PIN lock must be enabled first');
      }

      settings.appLock.biometricEnabled = true;
      settings.updatedAt = Date.now();
      await this.storageService.saveSettings(settings);

      console.log('Biometric authentication enabled');
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      throw error;
    }
  }

  async disableBiometric(): Promise<void> {
    try {
      const settings = await this.storageService.getSettings();
      if (settings.appLock) {
        settings.appLock.biometricEnabled = false;
        settings.updatedAt = Date.now();
        await this.storageService.saveSettings(settings);
      }

      console.log('Biometric authentication disabled');
    } catch (error) {
      console.error('Failed to disable biometric:', error);
      throw error;
    }
  }

  async authenticateWithBiometric(): Promise<boolean> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        return false;
      }

      await NativeBiometric.verifyIdentity({
        reason: 'Authenticate to access Suma',
        title: 'Suma Security',
        subtitle: 'Use your biometric to unlock',
        description: 'Verify your identity to access your financial data'
      });

      return true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  async disableLock(): Promise<void> {
    try {
      // Clear stored data
      await Preferences.remove({ key: this.PIN_SALT_KEY });
      await Preferences.remove({ key: this.LOCK_ENABLED_KEY });

      // Update settings
      const settings = await this.storageService.getSettings();
      settings.appLock = {
        enabled: false,
        biometricEnabled: false
      };
      settings.updatedAt = Date.now();
      await this.storageService.saveSettings(settings);

      console.log('App lock disabled');
    } catch (error) {
      console.error('Failed to disable lock:', error);
      throw error;
    }
  }

  async getLockSettings(): Promise<{
    enabled: boolean;
    biometricEnabled: boolean;
    biometricAvailable: boolean;
  }> {
    try {
      const enabled = await this.isLockEnabled();
      const biometricAvailable = await this.isBiometricAvailable();
      
      const settings = await this.storageService.getSettings();
      const biometricEnabled = settings.appLock?.biometricEnabled || false;

      return {
        enabled,
        biometricEnabled,
        biometricAvailable
      };
    } catch (error) {
      console.error('Error getting lock settings:', error);
      return {
        enabled: false,
        biometricEnabled: false,
        biometricAvailable: false
      };
    }
  }

  private async getStoredPinHash(): Promise<string> {
    const settings = await this.storageService.getSettings();
    return settings.appLock?.pinHash || '';
  }
}
