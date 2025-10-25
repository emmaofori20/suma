import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { NotificationsService } from './notifications.service';
import { Entry, Settings, Budget } from '../models/entry.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly BUDGET_WARNING_ID = 20;

  constructor(
    private storageService: StorageService,
    private notificationsService: NotificationsService
  ) {}

  async setBudget(budget: Budget): Promise<void> {
    try {
      const settings = await this.storageService.getSettings();
      settings.budget = budget;
      settings.updatedAt = Date.now();
      await this.storageService.saveSettings(settings);
    } catch (error) {
      console.error('Error setting budget:', error);
      throw error;
    }
  }

  async getBudget(): Promise<Budget | null> {
    try {
      const settings = await this.storageService.getSettings();
      return settings.budget || null;
    } catch (error) {
      console.error('Error getting budget:', error);
      return null;
    }
  }

  async getCurrentPeriodSpending(): Promise<{
    spent: number;
    budget: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
    periodStart: number;
    periodEnd: number;
  }> {
    try {
      const budget = await this.getBudget();
      if (!budget) {
        return {
          spent: 0,
          budget: 0,
          remaining: 0,
          percentage: 0,
          isOverBudget: false,
          periodStart: 0,
          periodEnd: 0
        };
      }

      const { periodStart, periodEnd } = this.getPeriodBoundaries(budget.period);
      const entries = await this.storageService.getEntries();
      
      const periodEntries = entries.filter(entry => 
        entry.ts >= periodStart && 
        entry.ts <= periodEnd && 
        !entry.deleted && 
        entry.amount < 0
      );

      const spent = Math.abs(periodEntries.reduce((sum, entry) => sum + entry.amount, 0));
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const isOverBudget = spent > budget.amount;

      return {
        spent,
        budget: budget.amount,
        remaining,
        percentage,
        isOverBudget,
        periodStart,
        periodEnd
      };
    } catch (error) {
      console.error('Error calculating current period spending:', error);
      throw error;
    }
  }

  async checkBudgetWarning(): Promise<void> {
    try {
      const budget = await this.getBudget();
      if (!budget) return;

      const spending = await this.getCurrentPeriodSpending();
      const warningThreshold = budget.amount * budget.warnAtPct;

      if (spending.spent >= warningThreshold && spending.spent < budget.amount) {
        await this.sendBudgetWarning(spending);
      }
    } catch (error) {
      console.error('Error checking budget warning:', error);
    }
  }

  async getBudgetHistory(periods: number = 6): Promise<Array<{
    period: string;
    spent: number;
    budget: number;
    percentage: number;
    isOverBudget: boolean;
  }>> {
    try {
      const budget = await this.getBudget();
      if (!budget) return [];

      const entries = await this.storageService.getEntries();
      const history = [];

      for (let i = periods - 1; i >= 0; i--) {
        const { periodStart, periodEnd } = this.getPeriodBoundaries(
          budget.period, 
          i
        );

        const periodEntries = entries.filter(entry => 
          entry.ts >= periodStart && 
          entry.ts <= periodEnd && 
          !entry.deleted && 
          entry.amount < 0
        );

        const spent = Math.abs(periodEntries.reduce((sum, entry) => sum + entry.amount, 0));
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const isOverBudget = spent > budget.amount;

        const periodLabel = this.formatPeriodLabel(budget.period, i);

        history.push({
          period: periodLabel,
          spent,
          budget: budget.amount,
          percentage,
          isOverBudget
        });
      }

      return history;
    } catch (error) {
      console.error('Error getting budget history:', error);
      return [];
    }
  }

  private getPeriodBoundaries(period: 'monthly' | 'weekly', offset: number = 0): {
    periodStart: number;
    periodEnd: number;
  } {
    const now = new Date();
    
    if (period === 'weekly') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + (offset * 7)));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      return {
        periodStart: weekStart.getTime(),
        periodEnd: weekEnd.getTime()
      };
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      return {
        periodStart: monthStart.getTime(),
        periodEnd: monthEnd.getTime()
      };
    }
  }

  private formatPeriodLabel(period: 'monthly' | 'weekly', offset: number): string {
    const now = new Date();
    
    if (period === 'weekly') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + (offset * 7)));
      return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  }

  private async sendBudgetWarning(spending: {
    spent: number;
    budget: number;
    percentage: number;
  }): Promise<void> {
    try {
      const settings = await this.storageService.getSettings();
      if (!settings.dailyReminder) return;

      await this.notificationsService.scheduleBudgetWarning({
        id: this.BUDGET_WARNING_ID,
        title: 'Budget Warning',
        body: `You've spent ${spending.percentage.toFixed(0)}% of your budget. ${spending.budget - spending.spent > 0 ? `$${(spending.budget - spending.spent).toFixed(2)} remaining.` : 'You\'re over budget!'}`,
        schedule: { at: new Date(Date.now() + 1000) } // Show immediately
      });
    } catch (error) {
      console.error('Error sending budget warning:', error);
    }
  }
}
