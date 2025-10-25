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
  IonList, 
  IonCard, 
  IonCardContent,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonDatetimeButton,
  IonPopover,
  IonSegment,
  IonSegmentButton
} from '@ionic/angular/standalone';
import { arrowBack, download, filter, trendingDown, trendingUp, wallet } from 'ionicons/icons';
import { StorageService } from '../services/storage.service';
import { Entry, Settings } from '../models/entry.model';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonLabel,
    IonIcon,
    IonButtons,
    IonSegment,
    IonSegmentButton
  ]
})
export class HistoryPage implements OnInit {
  entries: Entry[] = [];
  filteredEntries: Entry[] = [];
  settings: Settings = { currency: '$', weekStartsOn: 0, theme: 'ocean', dailyReminder: false, reminderTime: '20:00', updatedAt: Date.now() };
  
  filterType: 'all' | 'income' | 'expense' = 'all';
  filterPeriod: 'all' | 'week' | 'month' | 'year' = 'all';
  
  totalIncome = 0;
  totalExpense = 0;
  netTotal = 0;

  constructor(
    private storageService: StorageService,
    private router: Router
  ) {
    addIcons({ arrowBack, download, filter, wallet, trendingUp, trendingDown });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.entries = await this.storageService.getEntries();
    this.settings = await this.storageService.getSettings();
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.entries];

    // Filter by type
    if (this.filterType !== 'all') {
      filtered = filtered.filter(entry => {
        if (this.filterType === 'income') return entry.amount >= 0;
        if (this.filterType === 'expense') return entry.amount < 0;
        return true;
      });
    }

    // Filter by period
    if (this.filterPeriod !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (this.filterPeriod) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(entry => new Date(entry.ts) >= filterDate);
    }

    this.filteredEntries = filtered.sort((a, b) => b.ts - a.ts);
    this.calculateTotals();
  }

  calculateTotals() {
    this.totalIncome = this.filteredEntries
      .filter(entry => entry.amount >= 0)
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    this.totalExpense = Math.abs(this.filteredEntries
      .filter(entry => entry.amount < 0)
      .reduce((sum, entry) => sum + entry.amount, 0));
    
    this.netTotal = this.totalIncome - this.totalExpense;
  }

  onFilterTypeChange() {
    this.applyFilters();
  }

  onFilterPeriodChange() {
    this.applyFilters();
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

  goBack() {
    this.router.navigate(['/home']);
  }

  formatAmount(amount: number): string {
    return `${this.settings.currency}${Math.abs(amount).toFixed(2)}`;
  }

  getEntryType(amount: number): string {
    return amount >= 0 ? 'income' : 'expense';
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }
}
