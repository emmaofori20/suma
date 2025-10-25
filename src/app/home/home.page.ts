import { Component, OnInit } from '@angular/core';
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
  IonInput, 
  IonList, 
  IonCard, 
  IonCardContent,
  IonIcon,
  IonFab,
  IonFabButton,
  IonModal,
  IonButtons,
  IonBackButton,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonDatetimeButton,
  IonPopover
} from '@ionic/angular/standalone';
import { add, remove, list, settings, trash, trendingDown, trendingUp, analytics, close } from 'ionicons/icons';
import { StorageService } from '../services/storage.service';
import { Entry, Settings } from '../models/entry.model';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
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
    IonInput,
    IonIcon,
    IonFab,
    IonFabButton,
    IonModal,
    IonButtons,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    
  ]
})
export class HomePage implements OnInit {
  entries: Entry[] = [];
  settings: Settings = { currency: '$', weekStartsOn: 0, theme: 'ocean', dailyReminder: false, reminderTime: '20:00', updatedAt: Date.now() };
  todayEntries: Entry[] = [];
  totalToday = 0;
  
  newEntry = {
    amount: '',
    note: '',
    type: 'expense' as 'income' | 'expense',
    tags: [] as string[]
  };

  availableTags: string[] = [];
  newTag = '';

  isModalOpen = false;
  public navigationInProgress = false;

  constructor(
    private storageService: StorageService,
    private router: Router
  ) {
    addIcons({ add, remove, list, settings, trash, trendingDown, trendingUp, analytics, close });
  }

  async ngOnInit() {
    await this.loadData();
  }
  
  async loadData() {
    this.entries = await this.storageService.getEntries();
    this.settings = await this.storageService.getSettings();
    this.availableTags = await this.storageService.getAllTags();
    this.filterTodayEntries();
  }

  filterTodayEntries() {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    this.todayEntries = this.entries.filter(entry => {
      const entryDate = new Date(entry.ts);
      return entryDate >= todayStart && entryDate < todayEnd;
    }).sort((a, b) => b.ts - a.ts);
    
    this.totalToday = this.todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }

  async addEntry() {
    if (!this.newEntry.amount || parseFloat(this.newEntry.amount) <= 0) {
      return;
    }

      const entry: Entry = {
        id: Date.now().toString(),
        ts: Date.now(),
        amount: this.newEntry.type === 'income'
          ? parseFloat(this.newEntry.amount)
          : -parseFloat(this.newEntry.amount),
        note: this.newEntry.note,
        tags: this.newEntry.tags,
        updatedAt: Date.now(),
        deleted: false
      };

    await this.storageService.saveEntry(entry);
    await this.loadData();
    
    this.newEntry = { amount: '', note: '', type: 'expense', tags: [] };
    this.isModalOpen = false;
  }

  async deleteEntry(id: string) {
    await this.storageService.deleteEntry(id);
    await this.loadData();
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  navigateToHistory() {
    this.router.navigate(['/history']);
  }

  navigateToInsights() {
    this.router.navigate(['/insights']);
  }

  navigateToSettings() {
    this.router.navigate(['/settings']);
  }

  formatAmount(amount: number): string {
    return `${this.settings.currency}${Math.abs(amount).toFixed(2)}`;
  }

  getEntryType(amount: number): string {
    return amount >= 0 ? 'income' : 'expense';
  }

  getIncomeCount(): number {
    return this.todayEntries.filter(entry => entry.amount >= 0).length;
  }

  getExpenseCount(): number {
    return this.todayEntries.filter(entry => entry.amount < 0).length;
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  addTag() {
    if (this.newTag.trim() && !this.newEntry.tags.includes(this.newTag.trim())) {
      this.newEntry.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  removeTag(tag: string) {
    this.newEntry.tags = this.newEntry.tags.filter(t => t !== tag);
  }

  selectExistingTag(tag: string) {
    if (!this.newEntry.tags.includes(tag)) {
      this.newEntry.tags.push(tag);
    }
  }
}
