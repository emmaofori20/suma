import { Entry, Settings } from '../models/entry.model';

export interface SyncProvider {
  signInAnon(): Promise<{ uid: string }>;
  upsertEntries(entries: Entry[]): Promise<void>;
  pullEntries(since?: number): Promise<Entry[]>;
  upsertSettings(settings: Settings): Promise<void>;
  pullSettings(): Promise<Settings | null>;
  lastServerTs(): Promise<number>;
}
