import { Injectable } from '@angular/core';

export interface DeltaConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  usdToInr: number;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly STORAGE_KEY = 'crypto_scanner_settings';

  constructor() {}

  /**
   * Save settings to localStorage
   */
  saveSettings(config: DeltaConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
      console.log('Settings saved successfully', config);
    } catch (error) {
      console.error('Failed to save settings', error);
      throw new Error('Failed to save settings. Storage may be full.');
    }
  }

  /**
   * Load settings from localStorage
   * Returns null if not found
   */
  loadSettings(): DeltaConfig | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return null;
      }
      const config = JSON.parse(stored);
      console.log('Settings loaded from localStorage', config);
      return config;
    } catch (error) {
      console.error('Failed to load settings', error);
      return null;
    }
  }

  /**
   * Clear settings from localStorage
   */
  clearSettings(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Settings cleared');
    } catch (error) {
      console.error('Failed to clear settings', error);
    }
  }

  /**
   * Check if custom settings exist
   */
  hasCustomSettings(): boolean {
    return !!localStorage.getItem(this.STORAGE_KEY);
  }

  /**
   * Get default settings from config.json
   */
  async loadDefaultSettings(): Promise<DeltaConfig> {
    try {
      const response = await fetch('/assets/config.json');
      const config = await response.json();
      return {
        apiKey: config.delta.apiKey,
        apiSecret: config.delta.apiSecret,
        baseUrl: config.delta.baseUrl,
        usdToInr: config.delta.usdToInr
      };
    } catch (error) {
      console.error('Failed to load default settings', error);
      // Return hardcoded defaults as fallback
      return {
        apiKey: '',
        apiSecret: '',
        baseUrl: 'https://api.india.delta.exchange',
        usdToInr: 85
      };
    }
  }
}
