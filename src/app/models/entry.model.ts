export interface Entry {
  id: string;
  ts: number;
  amount: number;
  note?: string;
  tags: string[];
}

export interface Settings {
  currency: string;
  weekStartsOn: 0 | 1;
  theme: 'ocean' | 'mint' | 'sunset';
  dailyReminder: boolean;
  reminderTime: string; // HH:MM format
}

export interface AppState {
  entries: Entry[];
  settings: Settings;
  version: string;
  exportDate: number;
}
