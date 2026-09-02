import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, DeltaConfig } from '../../core/services/settings.service';
import { DeltaService } from '../../core/services/delta.service';
import { MobileDebugService } from '../../core/services/mobile-debug.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h1>⚙️ Settings</h1>
        <p class="subtitle">Configure your Delta Exchange API credentials</p>
      </div>

      <div class="settings-content">
        <!-- Success/Error Messages -->
        <div *ngIf="successMessage" class="alert alert-success">
          ✅ {{ successMessage }}
        </div>
        <div *ngIf="errorMessage" class="alert alert-error">
          ⚠️ {{ errorMessage }}
        </div>

        <!-- Info Box -->
        <div class="info-box">
          <h3>📝 How to Use</h3>
          <ul>
            <li>Enter your Delta Exchange API credentials below</li>
            <li>Click "Save Settings" to store them on your device</li>
            <li>Settings are saved in your phone's local storage</li>
            <li>Settings persist between app restarts</li>
            <li>No need to rebuild the APK!</li>
          </ul>
        </div>

        <!-- Settings Form -->
        <form (ngSubmit)="saveSettings()" class="settings-form">
          <div class="form-group">
            <label for="apiKey">
              API Key <span class="required">*</span>
            </label>
            <input
              type="text"
              id="apiKey"
              [(ngModel)]="config.apiKey"
              name="apiKey"
              placeholder="Enter your API key"
              [class.error]="!config.apiKey && showValidation"
              required
            />
            <small *ngIf="!config.apiKey && showValidation" class="error-text">
              API Key is required
            </small>
          </div>

          <div class="form-group">
            <label for="apiSecret">
              API Secret <span class="required">*</span>
            </label>
            <input
              type="password"
              id="apiSecret"
              [(ngModel)]="config.apiSecret"
              name="apiSecret"
              placeholder="Enter your API secret"
              [class.error]="!config.apiSecret && showValidation"
              required
            />
            <small *ngIf="!config.apiSecret && showValidation" class="error-text">
              API Secret is required
            </small>
            <small class="hint">Your secret is stored securely on your device</small>
          </div>

          <div class="form-group">
            <label for="baseUrl">
              Base URL <span class="required">*</span>
            </label>
            <select
              id="baseUrl"
              [(ngModel)]="config.baseUrl"
              name="baseUrl"
              required
            >
              <option value="https://api.india.delta.exchange">India API (api.india.delta.exchange)</option>
              <option value="https://api.delta.exchange">Global API (api.delta.exchange)</option>
            </select>
            <small class="hint">Select your Delta Exchange region</small>
          </div>

          <div class="form-group">
            <label for="usdToInr">
              USD to INR Rate <span class="required">*</span>
            </label>
            <input
              type="number"
              id="usdToInr"
              [(ngModel)]="config.usdToInr"
              name="usdToInr"
              placeholder="85"
              min="1"
              step="0.01"
              required
            />
            <small class="hint">Exchange rate for price conversion</small>
          </div>

          <!-- Action Buttons -->
          <div class="button-group">
            <button type="submit" class="btn btn-primary" [disabled]="saving">
              <span *ngIf="!saving">💾 Save Settings</span>
              <span *ngIf="saving">⏳ Saving...</span>
            </button>

            <button type="button" class="btn btn-secondary" (click)="testConnection()" [disabled]="testing">
              <span *ngIf="!testing">🧪 Test Connection</span>
              <span *ngIf="testing">⏳ Testing...</span>
            </button>

            <button type="button" class="btn btn-warning" (click)="loadDefaults()">
              🔄 Load Defaults
            </button>

            <button type="button" class="btn btn-danger" (click)="clearSettings()">
              🗑️ Clear Settings
            </button>
          </div>
        </form>

        <!-- Current Status -->
        <div class="status-box">
          <h3>📊 Current Status</h3>
          <div class="status-row">
            <span class="status-label">Using Custom Settings:</span>
            <span class="status-value" [class.yes]="hasCustomSettings" [class.no]="!hasCustomSettings">
              {{ hasCustomSettings ? 'Yes' : 'No (Using defaults)' }}
            </span>
          </div>
          <div class="status-row">
            <span class="status-label">API Key:</span>
            <span class="status-value monospace">
              {{ config.apiKey ? (config.apiKey.substring(0, 10) + '...') : 'Not set' }}
            </span>
          </div>
          <div class="status-row">
            <span class="status-label">Base URL:</span>
            <span class="status-value monospace">{{ config.baseUrl }}</span>
          </div>
        </div>

        <!-- Test Results -->
        <div *ngIf="testResult" class="test-results">
          <h3>🧪 Test Results</h3>
          <pre>{{ testResult | json }}</pre>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      min-height: calc(100vh - 64px);
      background: var(--bg-secondary);
      padding: var(--spacing-lg);
    }

    .settings-header {
      max-width: 800px;
      margin: 0 auto var(--spacing-xl);
      text-align: center;
    }

    .settings-header h1 {
      font-size: var(--font-size-2xl);
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--text-primary);
    }

    .subtitle {
      color: var(--text-secondary);
      margin: 0;
    }

    .settings-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .alert {
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-lg);
      font-weight: 500;
    }

    .alert-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .info-box, .status-box {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
    }

    .info-box h3, .status-box h3 {
      margin: 0 0 var(--spacing-md) 0;
      color: var(--primary);
    }

    .info-box ul {
      margin: 0;
      padding-left: var(--spacing-lg);
      color: var(--text-secondary);
    }

    .info-box li {
      margin-bottom: var(--spacing-xs);
    }

    .settings-form {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
    }

    .form-group {
      margin-bottom: var(--spacing-lg);
    }

    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: var(--spacing-xs);
      color: var(--text-primary);
    }

    .required {
      color: var(--danger);
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: var(--spacing-md);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      background: var(--bg-secondary);
      color: var(--text-primary);
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--primary);
    }

    .form-group input.error {
      border-color: var(--danger);
    }

    .error-text {
      color: var(--danger);
      font-size: var(--font-size-xs);
      margin-top: var(--spacing-xs);
      display: block;
    }

    .hint {
      display: block;
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      margin-top: var(--spacing-xs);
    }

    .button-group {
      display: flex;
      gap: var(--spacing-md);
      flex-wrap: wrap;
      margin-top: var(--spacing-xl);
    }

    .btn {
      padding: var(--spacing-md) var(--spacing-lg);
      border: none;
      border-radius: var(--radius-md);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      flex: 1;
      min-width: 150px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-dark);
    }

    .btn-secondary {
      background: var(--secondary);
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      opacity: 0.9;
    }

    .btn-warning {
      background: #ffc107;
      color: #000;
    }

    .btn-warning:hover:not(:disabled) {
      background: #e0a800;
    }

    .btn-danger {
      background: var(--danger);
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #c82333;
    }

    .status-row {
      display: flex;
      justify-content: space-between;
      padding: var(--spacing-sm) 0;
      border-bottom: 1px solid var(--border-color);
    }

    .status-row:last-child {
      border-bottom: none;
    }

    .status-label {
      font-weight: 600;
      color: var(--text-secondary);
    }

    .status-value {
      color: var(--text-primary);
    }

    .status-value.yes {
      color: var(--success);
      font-weight: 600;
    }

    .status-value.no {
      color: var(--text-secondary);
    }

    .monospace {
      font-family: 'Courier New', monospace;
      font-size: var(--font-size-sm);
    }

    .test-results {
      background: #1a1a1a;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
    }

    .test-results h3 {
      margin: 0 0 var(--spacing-md) 0;
      color: var(--primary);
    }

    .test-results pre {
      background: #000;
      color: #00ff00;
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      overflow-x: auto;
      margin: 0;
    }

    @media (max-width: 768px) {
      .settings-container {
        padding: var(--spacing-md);
      }

      .button-group {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        min-width: 0;
      }

      .status-row {
        flex-direction: column;
        gap: var(--spacing-xs);
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  config: DeltaConfig = {
    apiKey: '',
    apiSecret: '',
    baseUrl: 'https://api.india.delta.exchange',
    usdToInr: 85
  };

  hasCustomSettings = false;
  saving = false;
  testing = false;
  showValidation = false;
  successMessage = '';
  errorMessage = '';
  testResult: any = null;

  constructor(
    private settingsService: SettingsService,
    private deltaService: DeltaService,
    private debugService: MobileDebugService
  ) {}

  async ngOnInit() {
    await this.loadCurrentSettings();
  }

  async loadCurrentSettings() {
    // Check if custom settings exist
    this.hasCustomSettings = this.settingsService.hasCustomSettings();

    if (this.hasCustomSettings) {
      // Load from localStorage
      const saved = this.settingsService.loadSettings();
      if (saved) {
        this.config = { ...saved };
        this.debugService.log('Settings: Loaded custom settings', this.config);
      }
    } else {
      // Load defaults from config.json
      const defaults = await this.settingsService.loadDefaultSettings();
      this.config = { ...defaults };
      this.debugService.log('Settings: Loaded default settings', this.config);
    }
  }

  async saveSettings() {
    this.showValidation = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Validate
    if (!this.config.apiKey || !this.config.apiSecret) {
      this.errorMessage = 'API Key and Secret are required';
      return;
    }

    this.saving = true;

    try {
      // Save to localStorage
      this.settingsService.saveSettings(this.config);

      // Reload DeltaService config
      await this.deltaService.reloadConfig();

      this.hasCustomSettings = true;
      this.successMessage = 'Settings saved successfully! The app will now use your credentials.';
      this.debugService.log('Settings: Saved and applied', this.config);

      // Clear success message after 5 seconds
      setTimeout(() => {
        this.successMessage = '';
      }, 5000);
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to save settings';
      this.debugService.error('Settings: Save failed', error);
    } finally {
      this.saving = false;
    }
  }

  async testConnection() {
    this.testing = true;
    this.errorMessage = '';
    this.testResult = null;

    try {
      // Save current settings first
      this.settingsService.saveSettings(this.config);
      await this.deltaService.reloadConfig();

      // Test products API
      const products = await this.deltaService.getAllProducts();

      this.testResult = {
        success: true,
        message: 'Connection successful!',
        productsCount: products.length,
        timestamp: new Date().toISOString()
      };

      this.successMessage = '✅ Connection test successful!';
      this.debugService.log('Settings: Connection test passed', this.testResult);
    } catch (error: any) {
      this.testResult = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      this.errorMessage = `Connection test failed: ${error.message}`;
      this.debugService.error('Settings: Connection test failed', error);
    } finally {
      this.testing = false;
    }
  }

  async loadDefaults() {
    if (confirm('Load default settings from config.json? This will not save them until you click Save.')) {
      const defaults = await this.settingsService.loadDefaultSettings();
      this.config = { ...defaults };
      this.successMessage = 'Default settings loaded. Click Save to apply them.';
      this.debugService.log('Settings: Loaded defaults', this.config);
    }
  }

  clearSettings() {
    if (confirm('Clear all custom settings? This will revert to defaults from config.json.')) {
      this.settingsService.clearSettings();
      this.hasCustomSettings = false;
      this.loadCurrentSettings();
      this.successMessage = 'Settings cleared. Using defaults from config.json.';
      this.debugService.log('Settings: Cleared custom settings');

      // Reload DeltaService to use defaults
      this.deltaService.reloadConfig();
    }
  }
}
