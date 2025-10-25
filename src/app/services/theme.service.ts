import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Settings } from '../models/entry.model';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme: 'ocean' | 'mint' | 'sunset' = 'ocean';

  constructor(private storageService: StorageService) {}

  async initializeTheme(): Promise<void> {
    const settings = await this.storageService.getSettings();
    this.applyTheme(settings.theme);
  }

  async setTheme(theme: 'ocean' | 'mint' | 'sunset'): Promise<void> {
    this.currentTheme = theme;
    this.applyTheme(theme);
    
    // Update settings
    const settings = await this.storageService.getSettings();
    settings.theme = theme;
    await this.storageService.saveSettings(settings);
  }

  getCurrentTheme(): 'ocean' | 'mint' | 'sunset' {
    return this.currentTheme;
  }

  private applyTheme(theme: 'ocean' | 'mint' | 'sunset'): void {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('theme-ocean', 'theme-mint', 'theme-sunset');
    
    // Add new theme class
    root.classList.add(`theme-${theme}`);
    
    // Update CSS custom properties
    switch (theme) {
      case 'ocean':
        root.style.setProperty('--primary-blue', '#4C7CF3');
        root.style.setProperty('--secondary-violet', '#A66EFC');
        root.style.setProperty('--bg-gradient', 'linear-gradient(180deg, #1E1E2F, #121212)');
        break;
      case 'mint':
        root.style.setProperty('--primary-blue', '#00D4AA');
        root.style.setProperty('--secondary-violet', '#4ECDC4');
        root.style.setProperty('--bg-gradient', 'linear-gradient(180deg, #1A2F1A, #0F1F0F)');
        break;
      case 'sunset':
        root.style.setProperty('--primary-blue', '#FF6B6B');
        root.style.setProperty('--secondary-violet', '#FF8E53');
        root.style.setProperty('--bg-gradient', 'linear-gradient(180deg, #2F1E1E, #1F0F0F)');
        break;
    }
  }

  getThemePresets() {
    return [
      {
        id: 'ocean',
        name: 'Ocean',
        description: 'Calm blue and violet',
        colors: {
          primary: '#4C7CF3',
          secondary: '#A66EFC'
        }
      },
      {
        id: 'mint',
        name: 'Mint',
        description: 'Fresh teal and mint',
        colors: {
          primary: '#00D4AA',
          secondary: '#4ECDC4'
        }
      },
      {
        id: 'sunset',
        name: 'Sunset',
        description: 'Warm coral and orange',
        colors: {
          primary: '#FF6B6B',
          secondary: '#FF8E53'
        }
      }
    ];
  }
}
