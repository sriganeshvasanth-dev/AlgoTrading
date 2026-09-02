import { Injectable } from '@angular/core';

/**
 * Utility & Helper Service
 * Provides common functions for formatting, calculations, and transformations
 * Reduces code duplication across services and components
 */
@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  /**
   * Format currency value with 2 decimal places
   */
  formatCurrency(value: number, decimals: number = 2): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Format currency value as string with INR symbol
   */
  formatCurrencyINR(value: number): string {
    return `₹${this.formatCurrency(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Format currency value as string with USD symbol
   */
  formatCurrencyUSD(value: number): string {
    return `$${this.formatCurrency(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Convert USD to INR using fixed exchange rate
   */
  convertUsdToInr(usdAmount: number, exchangeRate: number = 85): number {
    return this.formatCurrency(usdAmount * exchangeRate);
  }

  /**
   * Convert INR to USD using fixed exchange rate
   */
  convertInrToUsd(inrAmount: number, exchangeRate: number = 85): number {
    return this.formatCurrency(inrAmount / exchangeRate);
  }

  /**
   * Get percentage change
   */
  getPercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return 0;
    return this.formatCurrency((((newValue - oldValue) / oldValue) * 100));
  }

  /**
   * Get CSS class for P&L color coding (profit/loss)
   */
  getPnLColorClass(value: number): string {
    if (value > 0) return 'pnl-positive';
    if (value < 0) return 'pnl-negative';
    return 'pnl-neutral';
  }

  /**
   * Format date to YYYY-MM-DD
   */
  formatDate(date: Date | string): string {
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  }

  /**
   * Parse date string to Date object
   */
  parseDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00Z');
  }

  /**
   * Get week number from date
   */
  getWeekNumber(date: Date | string): { year: number; week: number } {
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00Z') : date;
    const d = new Date(dateObj);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: d.getFullYear(), week: weekNum };
  }

  /**
   * Check if two objects are equal (shallow comparison)
   */
  areObjectsEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  /**
   * Deep clone an object
   */
  deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Debounce function calls
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delayMs: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: any;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delayMs);
    };
  }

  /**
   * Throttle function calls
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delayMs: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delayMs) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * Generate unique ID
   */
  generateUniqueId(prefix: string = 'id'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if value is valid number
   */
  isValidNumber(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  /**
   * Safe parse JSON with fallback
   */
  safeJsonParse<T>(json: string, fallback: T): T {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  /**
   * Retry async function with exponential backoff
   */
  async retryAsync<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
    throw new Error('Max retries exceeded');
  }
}
