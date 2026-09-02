import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileDebugService } from '../../core/services/mobile-debug.service';
import { DeltaService } from '../../core/services/delta.service';

@Component({
  selector: 'app-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="debug-container">
      <div class="debug-header">
        <h2>Debug Console</h2>
        <div class="button-group">
          <button (click)="testConfig()">Test Config</button>
          <button (click)="testProducts()">Test Products</button>
          <button (click)="testPositions()">Test Positions</button>
          <button (click)="clearLogs()">Clear</button>
          <button (click)="copyLogs()">Copy All</button>
        </div>
      </div>

      <div class="system-info">
        <h3>System Info</h3>
        <pre>{{ systemInfo | json }}</pre>
      </div>

      <div class="logs-container">
        <h3>Logs ({{ logs.length }})</h3>
        <div class="logs">
          <div *ngFor="let log of logs" class="log-entry">{{ log }}</div>
          <div *ngIf="logs.length === 0" class="empty-state">No logs yet</div>
        </div>
      </div>

      <div class="test-results" *ngIf="testResult">
        <h3>Test Result</h3>
        <pre>{{ testResult | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .debug-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }

    .debug-header {
      background: #1a1a1a;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .debug-header h2 {
      margin: 0 0 15px 0;
      color: #4CAF50;
    }

    .button-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    button {
      padding: 8px 16px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    button:active {
      background: #1976D2;
    }

    .system-info {
      background: #1a1a1a;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .system-info h3 {
      margin: 0 0 10px 0;
      color: #FFC107;
    }

    .logs-container {
      background: #1a1a1a;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .logs-container h3 {
      margin: 0 0 10px 0;
      color: #FF9800;
    }

    .logs {
      background: #000;
      padding: 10px;
      border-radius: 4px;
      max-height: 400px;
      overflow-y: auto;
    }

    .log-entry {
      color: #00ff00;
      margin-bottom: 5px;
      word-break: break-all;
      white-space: pre-wrap;
    }

    .empty-state {
      color: #666;
      text-align: center;
      padding: 20px;
    }

    .test-results {
      background: #1a1a1a;
      padding: 15px;
      border-radius: 8px;
    }

    .test-results h3 {
      margin: 0 0 10px 0;
      color: #E91E63;
    }

    pre {
      background: #000;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      color: #00ff00;
      margin: 0;
    }

    @media (max-width: 768px) {
      .debug-container {
        padding: 10px;
      }

      button {
        font-size: 11px;
        padding: 6px 12px;
      }

      .logs {
        max-height: 300px;
      }
    }
  `]
})
export class DebugComponent implements OnInit {
  logs: string[] = [];
  systemInfo: any = {};
  testResult: any = null;

  constructor(
    private debugService: MobileDebugService,
    private deltaService: DeltaService
  ) {}

  ngOnInit() {
    this.systemInfo = this.debugService.getSystemInfo();
    this.refreshLogs();

    // Auto-refresh logs every 2 seconds
    setInterval(() => this.refreshLogs(), 2000);
  }

  refreshLogs() {
    this.logs = this.debugService.getLogs();
  }

  clearLogs() {
    this.debugService.clearLogs();
    this.testResult = null;
    this.refreshLogs();
  }

  copyLogs() {
    const text = this.logs.join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('Logs copied to clipboard!');
    } else {
      alert('Clipboard not available. Logs are shown above.');
    }
  }

  async testConfig() {
    this.debugService.log('=== Testing Config Load ===');
    this.testResult = null;
    try {
      const response = await fetch('/assets/config.json');
      const config = await response.json();
      this.testResult = {
        success: true,
        config: config
      };
      this.debugService.log('Config test: SUCCESS', config);
    } catch (error: any) {
      this.testResult = {
        success: false,
        error: error.message
      };
      this.debugService.error('Config test: FAILED', error);
    }
    this.refreshLogs();
  }

  async testProducts() {
    this.debugService.log('=== Testing Products API ===');
    this.testResult = null;
    try {
      const products = await this.deltaService.getAllProducts();
      this.testResult = {
        success: true,
        count: products.length,
        sample: products.slice(0, 3)
      };
      this.debugService.log('Products test: SUCCESS', { count: products.length });
    } catch (error: any) {
      this.testResult = {
        success: false,
        error: error.message
      };
      this.debugService.error('Products test: FAILED', error);
    }
    this.refreshLogs();
  }

  async testPositions() {
    this.debugService.log('=== Testing Positions API ===');
    this.testResult = null;
    try {
      const positions = await this.deltaService.getPositions();
      this.testResult = {
        success: true,
        count: positions.length,
        positions: positions
      };
      this.debugService.log('Positions test: SUCCESS', { count: positions.length });
    } catch (error: any) {
      this.testResult = {
        success: false,
        error: error.message
      };
      this.debugService.error('Positions test: FAILED', error);
    }
    this.refreshLogs();
  }
}
