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
  IonSegment,
  IonSegmentButton
} from '@ionic/angular/standalone';
import { arrowBack, analytics } from 'ionicons/icons';
import { StorageService } from '../services/storage.service';
import { Entry, Settings } from '../models/entry.model';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { 
  comparePeriods, 
  topTags, 
  streakDays, 
  detectAnomalies, 
  getWeekBoundaries, 
  getMonthBoundaries,
  PeriodComparison,
  TopTag,
  Anomaly
} from '../utils/insights.util';

@Component({
  selector: 'app-insights',
  templateUrl: 'insights.page.html',
  styleUrls: ['insights.page.scss'],
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
    IonSegmentButton,
    BaseChartDirective
  ]
})
export class InsightsPage implements OnInit {
  entries: Entry[] = [];
  settings: Settings = { currency: '$', weekStartsOn: 0, theme: 'ocean', dailyReminder: false, reminderTime: '20:00', updatedAt: Date.now() };
  
  filterPeriod: 'week' | 'month' | 'all' = 'week';
  
  // New insights data
  weekComparison: PeriodComparison | null = null;
  topSpendingTags: TopTag[] = [];
  spendingStreak: number = 0;
  anomalies: Anomaly[] = [];
  
  // Bar Chart - Net Flow
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#EDEDED'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#EDEDED'
        }
      }
    }
  };
  
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1
    }]
  };

  // Pie Chart - Spending by Tag
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#EDEDED',
          usePointStyle: true,
          padding: 20
        }
      }
    }
  };
  
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderColor: '#262638',
      borderWidth: 2
    }]
  };

  constructor(
    private storageService: StorageService,
    private router: Router
  ) {
    addIcons({ arrowBack, analytics });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.entries = await this.storageService.getEntries();
    this.settings = await this.storageService.getSettings();
    this.updateCharts();
    this.calculateInsights();
  }

  onFilterPeriodChange() {
    this.updateCharts();
  }

  updateCharts() {
    this.updateBarChart();
    this.updatePieChart();
  }

  private updateBarChart() {
    const filteredEntries = this.getFilteredEntries();
    const dailyData = this.groupByDay(filteredEntries);
    
    const labels = Object.keys(dailyData).sort();
    const data = labels.map(date => dailyData[date]);
    const colors = data.map(value => 
      value >= 0 ? '#00D4AA' : '#FF6B6B'
    );
    
    this.barChartData = {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    };
  }

  private updatePieChart() {
    const filteredEntries = this.getFilteredEntries();
    const expenseEntries = filteredEntries.filter(entry => entry.amount < 0);
    const tagData = this.groupByTag(expenseEntries);
    
    const sortedTags = Object.entries(tagData)
      .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))
      .slice(0, 6);
    
    const labels = sortedTags.map(([tag]) => tag);
    const data = sortedTags.map(([,amount]) => Math.abs(amount));
    
    // Add "Others" if there are more than 6 tags
    if (Object.keys(tagData).length > 6) {
      const otherAmount = Object.entries(tagData)
        .slice(6)
        .reduce((sum, [,amount]) => sum + Math.abs(amount), 0);
      
      if (otherAmount > 0) {
        labels.push('Others');
        data.push(otherAmount);
      }
    }
    
    const colors = [
      '#4C7CF3', '#A66EFC', '#00D4AA', '#FF6B6B', 
      '#FF8E53', '#FDCB6E', '#A3A3A3'
    ];
    
    this.pieChartData = {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#262638',
        borderWidth: 2
      }]
    };
  }

  private getFilteredEntries(): Entry[] {
    const now = new Date();
    const filterDate = new Date();

    switch (this.filterPeriod) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        return this.entries;
    }

    return this.entries.filter(entry => new Date(entry.ts) >= filterDate);
  }

  private groupByDay(entries: Entry[]): { [date: string]: number } {
    const grouped: { [date: string]: number } = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.ts).toLocaleDateString();
      grouped[date] = (grouped[date] || 0) + entry.amount;
    });
    
    return grouped;
  }

  private groupByTag(entries: Entry[]): { [tag: string]: number } {
    const grouped: { [tag: string]: number } = {};
    
    entries.forEach(entry => {
      if (entry.tags && entry.tags.length > 0) {
        entry.tags.forEach(tag => {
          grouped[tag] = (grouped[tag] || 0) + entry.amount;
        });
      } else {
        grouped['Untagged'] = (grouped['Untagged'] || 0) + entry.amount;
      }
    });
    
    return grouped;
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  formatAmount(amount: number): string {
    return `${this.settings.currency}${Math.abs(amount).toFixed(2)}`;
  }

  getTotalIncome(): number {
    const filteredEntries = this.getFilteredEntries();
    return filteredEntries
      .filter(entry => entry.amount >= 0)
      .reduce((sum, entry) => sum + entry.amount, 0);
  }

  getTotalExpenses(): number {
    const filteredEntries = this.getFilteredEntries();
    return Math.abs(filteredEntries
      .filter(entry => entry.amount < 0)
      .reduce((sum, entry) => sum + entry.amount, 0));
  }

  getNetTotal(): number {
    return this.getTotalIncome() - this.getTotalExpenses();
  }

  calculateInsights() {
    try {
      // Calculate week comparison
      this.calculateWeekComparison();
      
      // Calculate top spending tags
      this.calculateTopSpendingTags();
      
      // Calculate spending streak
      this.spendingStreak = streakDays(this.entries);
      
      // Detect anomalies
      this.detectSpendingAnomalies();
    } catch (error) {
      console.error('Error calculating insights:', error);
    }
  }

  private calculateWeekComparison() {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    
    // Current week
    const currentWeekStart = now - weekMs;
    const currentWeekEnd = now;
    
    // Previous week
    const previousWeekStart = currentWeekStart - weekMs;
    const previousWeekEnd = currentWeekStart;
    
    this.weekComparison = comparePeriods(
      this.entries,
      currentWeekStart,
      currentWeekEnd,
      previousWeekStart,
      previousWeekEnd
    );
  }

  private calculateTopSpendingTags() {
    const now = Date.now();
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    const monthStart = now - monthMs;
    const monthEnd = now;
    
    this.topSpendingTags = topTags(this.entries, monthStart, monthEnd, 3);
  }

  private detectSpendingAnomalies() {
    this.anomalies = [];
    
    // Check for anomalies in top spending tags
    this.topSpendingTags.forEach(tag => {
      const anomaly = detectAnomalies(this.entries, tag.tag, 4);
      if (anomaly) {
        this.anomalies.push(anomaly);
      }
    });
  }

  getTrendIcon(trend: 'up' | 'down' | 'same'): string {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  }

  getTrendColor(trend: 'up' | 'down' | 'same'): string {
    switch (trend) {
      case 'up': return 'danger';
      case 'down': return 'success';
      default: return 'medium';
    }
  }

  formatPercentage(percentage: number): string {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  }
}
