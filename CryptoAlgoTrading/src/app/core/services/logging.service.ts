import { Injectable } from '@angular/core';

/**
 * Logging Service
 * Centralized logging for the application
 * Replaces console logs with configurable, structured logging
 * Supports development and production modes
 */
@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private isDevelopment = !this.isProduction();
  private enableDetailedLogging = this.isDevelopment;

  constructor() {}

  /**
   * Check if running in production mode
   */
  private isProduction(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      !window.location.hostname.startsWith('127.')
    );
  }

  /**
   * Set detailed logging flag
   */
  setDetailedLogging(enabled: boolean): void {
    this.enableDetailedLogging = enabled;
  }

  /**
   * Log info level message
   */
  info(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log debug level message (only when detailed logging enabled)
   */
  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment && this.enableDetailedLogging) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log warning level message
   */
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  /**
   * Log error level message
   */
  error(message: string, error?: Error | unknown): void {
    console.error(`[ERROR] ${message}`, error);
  }

  /**
   * Log performance metrics
   */
  performance(label: string, duration: number): void {
    if (this.isDevelopment) {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Start performance timer
   */
  startTimer(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      this.performance(label, endTime - startTime);
    };
  }

  /**
   * Clear all logs (browser console only)
   */
  clear(): void {
    if (this.isDevelopment) {
      console.clear();
    }
  }

  /**
   * Group logs together
   */
  group(groupName: string, callback: () => void): void {
    if (this.isDevelopment) {
      console.group(`[GROUP] ${groupName}`);
      callback();
      console.groupEnd();
    }
  }
}
