export interface Entry {
  id: string;
  ts: number;
  amount: number;
  note?: string;
  tags: string[];
  updatedAt: number;
  deleted?: boolean;
}

export interface Budget {
  period: 'monthly' | 'weekly';
  amount: number;          // allowed spend
  warnAtPct: number;       // e.g., 0.8 for 80%
}

export interface Settings {
  currency: string;
  weekStartsOn: 0 | 1;
  theme: 'ocean' | 'mint' | 'sunset';
  dailyReminder: boolean;
  reminderTime: string; // HH:MM format
  updatedAt: number;
  budget?: Budget;
  appLock?: {
    enabled: boolean;
    pinHash?: string;
    biometricEnabled: boolean;
  };
  cloudSync?: {
    enabled: boolean;
    lastSync?: number;
    userId?: string;
  };
}

export interface AppState {
  entries: Entry[];
  settings: Settings;
  version: string;
  exportDate: number;
}
