import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MobileDebugService {
  private logs: string[] = [];
  private maxLogs = 100;

  log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;

    console.log(logEntry, data || '');

    this.logs.push(logEntry);
    if (data) {
      this.logs.push(JSON.stringify(data, null, 2));
    }

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Store in localStorage for debugging
    try {
      localStorage.setItem('app_debug_logs', JSON.stringify(this.logs));
    } catch (e) {
      // Ignore storage errors
    }
  }

  error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}`;

    console.error(logEntry, error || '');

    this.logs.push(logEntry);
    if (error) {
      this.logs.push(JSON.stringify({
        message: error?.message || error,
        stack: error?.stack,
        details: error
      }, null, 2));
    }

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    try {
      localStorage.setItem('app_debug_logs', JSON.stringify(this.logs));
    } catch (e) {
      // Ignore storage errors
    }
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('app_debug_logs');
    } catch (e) {
      // Ignore
    }
  }

  getSystemInfo(): any {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      href: window.location.href,
      protocol: window.location.protocol,
      host: window.location.host
    };
  }
}
