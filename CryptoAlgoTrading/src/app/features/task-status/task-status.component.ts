import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskSchedulerService, TaskExecutionStatus, TaskExecutionHistory } from '../../core/services/task-scheduler.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-task-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="task-status-container">
      <div class="task-status-header">
        <h3>📊 Task Execution Status</h3>
        <button class="btn-refresh" (click)="refreshStatus()" title="Refresh status">
          🔄
        </button>
      </div>

      <div class="tasks-grid">
        <div *ngFor="let task of taskList" class="task-card" [ngClass]="'status-' + task.status">
          <div class="task-header">
              <h4>{{ task.taskName }}</h4>
              <span class="status-badge" [ngClass]="'status-' + task.status">
                {{ getStatusLabel(task.status) }}
              </span>
              <!-- Details Button in Header (Visible for Completed/Failed Tasks or when results exist) -->
              <button *ngIf="task.status === 'completed' || task.status === 'failed' || task.results" 
                        class="btn-header-details" 
                        (click)="openDetailsModal(task)" 
                        title="View execution details">
                📋
              </button>
            </div>

          <div class="task-details">
            <div class="detail-row" *ngIf="task.startTime">
              <span class="label">Last Run:</span>
              <span class="value">{{ task.startTime | date:'short' }}</span>
            </div>

            <div class="detail-row" *ngIf="task.endTime">
              <span class="label">Duration:</span>
              <span class="value">{{ task.duration }}ms</span>
            </div>

            <div class="detail-row" *ngIf="task.error">
              <span class="label">Error:</span>
              <span class="value error-text">{{ task.error }}</span>
            </div>

            <div class="detail-row" *ngIf="task.nextScheduledTime">
              <span class="label">Next Run:</span>
              <span class="value">{{ task.nextScheduledTime | date:'short' }}</span>
            </div>

            <div class="detail-row" *ngIf="task.retryCount > 0">
              <span class="label">Retries:</span>
              <span class="value">{{ task.retryCount }}</span>
            </div>

          <div class="execution-history" *ngIf="getTaskHistoryLength(task.taskId) > 0">
            <div class="history-header">
              <span>Recent Executions (Last {{ getTaskHistoryLength(task.taskId) }})</span>
              <button class="btn-small" (click)="clearHistory(task.taskId)" title="Clear history">
                ✕
              </button>
            </div>

            <div class="history-list">
              <div *ngFor="let exec of getTaskHistoryExecutions(task.taskId)" 
                   class="history-item" [ngClass]="'status-' + exec.status">
                <span class="time">{{ exec.startTime ? (exec.startTime | date:'HH:mm:ss') : 'N/A' }}</span>
                <span class="status">{{ getStatusLabel(exec.status) }}</span>
                <span class="duration">{{ exec.duration }}ms</span>
                <span class="error" *ngIf="exec.error" title="{{ exec.error }}">⚠️</span>
                <button class="btn-history-details" *ngIf="exec.results" (click)="openDetailsModal(exec)" title="View details">
                  📋
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Modal -->
      <div class="modal-overlay" *ngIf="selectedTaskForDetails" (click)="closeDetailsModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ selectedTaskForDetails.taskName }} - Execution Details</h3>
            <button class="btn-close" (click)="closeDetailsModal()">✕</button>
          </div>

          <div class="modal-body">
            <!-- Execution Info -->
            <div class="section">
              <h4>Execution Info</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Status:</span>
                  <span class="value" [ngClass]="'status-' + selectedTaskForDetails.status">
                    {{ getStatusLabel(selectedTaskForDetails.status) }}
                  </span>
                </div>
                <div class="info-item" *ngIf="selectedTaskForDetails.startTime">
                  <span class="label">Started:</span>
                  <span class="value">{{ selectedTaskForDetails.startTime | date:'medium' }}</span>
                </div>
                <div class="info-item" *ngIf="selectedTaskForDetails.duration">
                  <span class="label">Duration:</span>
                  <span class="value">{{ selectedTaskForDetails.duration }}ms</span>
                </div>
                <div class="info-item" *ngIf="selectedTaskForDetails.error">
                  <span class="label">Error:</span>
                  <span class="value error">{{ selectedTaskForDetails.error }}</span>
                </div>
              </div>
            </div>

            <!-- Results Summary (if available) -->
            <div class="section" *ngIf="selectedTaskForDetails.results">
              <h4>Results</h4>
              <div class="results-container">
                <!-- For array results (bracket orders, trailing SL) -->
                <div *ngIf="isArrayResults(selectedTaskForDetails.results)" class="array-results">
                  <div class="result-summary" *ngIf="getResultsSummary(selectedTaskForDetails.results) as summary">
                    <div class="summary-item">
                      <span class="summary-label">Total:</span>
                      <span class="summary-value">{{ summary.total }}</span>
                    </div>
                    <div class="summary-item" *ngIf="summary.success">
                      <span class="summary-label success">Success:</span>
                      <span class="summary-value success">{{ summary.success }}</span>
                    </div>
                    <div class="summary-item" *ngIf="summary.failed">
                      <span class="summary-label failed">Failed:</span>
                      <span class="summary-value failed">{{ summary.failed }}</span>
                    </div>
                  </div>

                  <div class="result-items">
                    <div *ngFor="let item of selectedTaskForDetails.results" 
                         class="result-item" [ngClass]="item.success ? 'success' : 'failed'">
                      <div class="result-item-header">
                        <span class="result-icon">{{ item.success ? '✓' : '✗' }}</span>
                        <span class="result-symbol">{{ item.symbol }}</span>
                        <span class="result-type" *ngIf="item.type">[{{ item.type }}]</span>
                      </div>
                      <div class="result-item-body">
                        <p class="result-message">{{ item.message }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- For object results with nested results array (Move SL to Entry, Cleanup Target Orders) -->
                <div *ngIf="!isArrayResults(selectedTaskForDetails.results)" class="object-results">
                  <!-- Display summary from object properties -->
                  <div class="result-summary" *ngIf="selectedTaskForDetails.results.total || selectedTaskForDetails.results.succeeded">
                    <div class="summary-item">
                      <span class="summary-label">Total:</span>
                      <span class="summary-value">{{ selectedTaskForDetails.results.total }}</span>
                    </div>
                    <div class="summary-item" *ngIf="selectedTaskForDetails.results.succeeded !== undefined">
                      <span class="summary-label success">Success:</span>
                      <span class="summary-value success">{{ selectedTaskForDetails.results.succeeded }}</span>
                    </div>
                    <div class="summary-item" *ngIf="selectedTaskForDetails.results.failed !== undefined">
                      <span class="summary-label failed">Failed:</span>
                      <span class="summary-value failed">{{ selectedTaskForDetails.results.failed }}</span>
                    </div>
                  </div>

                  <!-- Display nested results array if available -->
                  <div class="result-items" *ngIf="isArrayResults(selectedTaskForDetails.results.results)">
                    <div *ngFor="let item of selectedTaskForDetails.results.results" 
                         class="result-item" [ngClass]="item.success ? 'success' : 'failed'">
                      <div class="result-item-header">
                        <span class="result-icon">{{ item.success ? '✓' : '✗' }}</span>
                        <span class="result-symbol">{{ item.symbol }}</span>
                        <span class="result-type" *ngIf="item.type">[{{ item.type }}]</span>
                      </div>
                      <div class="result-item-body">
                        <p class="result-message">{{ item.message }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Fallback to JSON display if no results array -->
                  <div *ngIf="!isArrayResults(selectedTaskForDetails.results.results)">
                    <pre>{{ selectedTaskForDetails.results | json }}</pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Results Message -->
            <div class="section" *ngIf="!selectedTaskForDetails.results">
              <p class="no-results">No detailed results available for this execution.</p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-close-modal" (click)="closeDetailsModal()">Close</button>
          </div>
        </div>
      </div>

      <div class="task-status-footer">
        <p class="last-update">Last updated: {{ lastUpdateTime | date:'medium' }}</p>
      </div>
    </div>
  `,
  styles: [`
    .task-status-container {
      background: #1e1e1e;
      border: 1px solid #3a3a3a;
      border-radius: 8px;
      padding: 20px;
      margin: 10px 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .task-status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #3a3a3a;
      padding-bottom: 10px;
    }

    .task-status-header h3 {
      margin: 0;
      color: #e0e0e0;
      font-size: 18px;
    }

    .btn-refresh {
      background: #0e639c;
      border: none;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.3s;
    }

    .btn-refresh:hover {
      background: #1177bb;
    }

    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .task-card {
      background: #252526;
      border: 1px solid #3e3e42;
      border-radius: 6px;
      padding: 15px;
      transition: all 0.3s;
    }

    .task-card:hover {
      border-color: #0e639c;
      box-shadow: 0 0 8px rgba(14, 99, 156, 0.3);
    }

    .task-card.running {
      border-left: 4px solid #007acc;
    }

    .task-card.completed {
      border-left: 4px solid #4ec9b0;
    }

    .task-card.failed {
      border-left: 4px solid #f44747;
    }

    .task-card.pending {
      border-left: 4px solid #dcdcaa;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #3e3e42;
    }

    .task-header h4 {
      margin: 0;
      color: #e0e0e0;
      font-size: 16px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      white-space: nowrap;
    }

    .status-badge.status-running {
      background: #007acc;
      color: white;
    }

    .status-badge.status-completed {
      background: #4ec9b0;
      color: white;
    }

    .status-badge.status-failed {
      background: #f44747;
      color: white;
    }

    .status-badge.status-pending {
      background: #dcdcaa;
      color: black;
    }

    .status-badge.status-skipped {
      background: #858585;
      color: white;
    }

    .btn-header-details {
      background: transparent;
      border: none;
      color: #569cd6;
      cursor: pointer;
      padding: 4px 8px;
      font-size: 16px;
      margin-left: 8px;
      transition: color 0.3s, transform 0.2s;
      flex-shrink: 0;
    }

    .btn-header-details:hover {
      color: #7fb3ff;
      transform: scale(1.1);
    }

    .task-details {
      margin-bottom: 12px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
    }

    .detail-row .label {
      color: #858585;
      font-weight: 500;
    }

    .detail-row .value {
      color: #e0e0e0;
    }

    .error-text {
      color: #f44747 !important;
      word-break: break-all;
    }

    .execution-history {
      background: #1e1e1e;
      border: 1px solid #3e3e42;
      border-radius: 4px;
      padding: 10px;
      margin-top: 12px;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12px;
      color: #858585;
      border-bottom: 1px solid #3e3e42;
      padding-bottom: 6px;
    }

    .btn-small {
      background: none;
      border: none;
      color: #858585;
      cursor: pointer;
      font-size: 12px;
      padding: 0;
      transition: color 0.2s;
    }

    .btn-small:hover {
      color: #f44747;
    }

    .history-list {
      max-height: 150px;
      overflow-y: auto;
    }

    .history-item {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 4px 0;
      font-size: 11px;
      border-bottom: 1px solid #3e3e42;
      padding-bottom: 4px;
    }

    .history-item .time {
      color: #858585;
      min-width: 60px;
    }

    .history-item .status {
      color: #dcdcaa;
      min-width: 70px;
    }

    .history-item.status-completed .status {
      color: #4ec9b0;
    }

    .history-item.status-failed .status {
      color: #f44747;
    }

    .history-item .duration {
      color: #858585;
      font-size: 10px;
    }

    .history-item .error {
      color: #f44747;
      cursor: help;
    }

    .task-status-footer {
      border-top: 1px solid #3a3a3a;
      padding-top: 10px;
      text-align: center;
    }

    .last-update {
      margin: 0;
      color: #858585;
      font-size: 12px;
    }

    /* Scrollbar styling for history list */
    .history-list::-webkit-scrollbar {
      width: 6px;
    }

    .history-list::-webkit-scrollbar-track {
      background: #1e1e1e;
      border-radius: 3px;
    }

    .history-list::-webkit-scrollbar-thumb {
      background: #424242;
      border-radius: 3px;
    }

    .history-list::-webkit-scrollbar-thumb:hover {
      background: #4e4e4e;
    }

    /* Details Button Styles */
    .btn-details {
      background: #0e639c;
      border: none;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.3s;
      width: 100%;
      margin-top: 8px;
    }

    .btn-details:hover {
      background: #1177bb;
    }

    .btn-history-details {
      background: transparent;
      border: none;
      color: #0e639c;
      cursor: pointer;
      padding: 2px 4px;
      font-size: 14px;
      margin-left: 4px;
      transition: color 0.3s;
    }

    .btn-history-details:hover {
      color: #1177bb;
    }

    /* Modal Overlay */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: #252526;
      border: 1px solid #3e3e42;
      border-radius: 8px;
      max-width: 800px;
      width: 100%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #3e3e42;
    }

    .modal-header h3 {
      margin: 0;
      color: #e0e0e0;
      font-size: 18px;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #858585;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.3s;
    }

    .btn-close:hover {
      color: #e0e0e0;
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    .section {
      margin-bottom: 20px;
    }

    .section h4 {
      color: #e0e0e0;
      font-size: 16px;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #3e3e42;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      background: #1e1e1e;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #3e3e42;
    }

    .info-item .label {
      color: #858585;
      font-size: 12px;
      margin-bottom: 4px;
    }

    .info-item .value {
      color: #e0e0e0;
      font-size: 14px;
      word-break: break-word;
    }

    .info-item .value.error {
      color: #f44747;
    }

    .results-container {
      background: #1e1e1e;
      border: 1px solid #3e3e42;
      border-radius: 4px;
      padding: 12px;
    }

    .result-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 12px;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #3e3e42;
    }

    .summary-item {
      text-align: center;
      padding: 8px;
      background: #252526;
      border-radius: 4px;
    }

    .summary-label {
      display: block;
      font-size: 12px;
      color: #858585;
      margin-bottom: 4px;
    }

    .summary-label.success {
      color: #4ec9b0;
    }

    .summary-label.failed {
      color: #f44747;
    }

    .summary-value {
      display: block;
      font-size: 18px;
      font-weight: bold;
      color: #e0e0e0;
    }

    .summary-value.success {
      color: #4ec9b0;
    }

    .summary-value.failed {
      color: #f44747;
    }

    .result-items {
      max-height: 400px;
      overflow-y: auto;
    }

    .result-item {
      background: #2d2d30;
      border: 1px solid #3e3e42;
      border-left: 4px solid #858585;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 8px;
      transition: all 0.3s;
    }

    .result-item.success {
      border-left-color: #4ec9b0;
      background: rgba(78, 201, 176, 0.1);
    }

    .result-item.failed {
      border-left-color: #f44747;
      background: rgba(244, 71, 71, 0.1);
    }

    .result-item:hover {
      border-color: #0e639c;
    }

    .result-item-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .result-icon {
      font-weight: bold;
      font-size: 16px;
    }

    .result-item.success .result-icon {
      color: #4ec9b0;
    }

    .result-item.failed .result-icon {
      color: #f44747;
    }

    .result-symbol {
      color: #e0e0e0;
      font-weight: 500;
      font-family: monospace;
    }

    .result-type {
      color: #858585;
      font-size: 12px;
    }

    .result-item-body {
      margin-left: 24px;
    }

    .result-message {
      margin: 0;
      color: #e0e0e0;
      font-size: 13px;
      line-height: 1.4;
      word-break: break-word;
    }

    .object-results pre {
      background: #1e1e1e;
      border: 1px solid #3e3e42;
      border-radius: 4px;
      padding: 12px;
      max-height: 400px;
      overflow-y: auto;
      color: #e0e0e0;
      font-size: 12px;
      margin: 0;
    }

    .no-results {
      color: #858585;
      text-align: center;
      padding: 20px;
      margin: 0;
    }

    .modal-footer {
      padding: 15px 20px;
      border-top: 1px solid #3e3e42;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .btn-close-modal {
      background: #0e639c;
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.3s;
    }

    .btn-close-modal:hover {
      background: #1177bb;
    }

    /* Scrollbar for modal results */
    .result-items::-webkit-scrollbar {
      width: 6px;
    }

    .result-items::-webkit-scrollbar-track {
      background: #1e1e1e;
      border-radius: 3px;
    }

    .result-items::-webkit-scrollbar-thumb {
      background: #424242;
      border-radius: 3px;
    }

    .result-items::-webkit-scrollbar-thumb:hover {
      background: #4e4e4e;
    }

    .object-results pre::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    .object-results pre::-webkit-scrollbar-track {
      background: #252526;
      border-radius: 3px;
    }

    .object-results pre::-webkit-scrollbar-thumb {
      background: #424242;
      border-radius: 3px;
    }

    .object-results pre::-webkit-scrollbar-thumb:hover {
      background: #4e4e4e;
    }
  `]
})

export class TaskStatusComponent implements OnInit, OnDestroy {
  taskList: TaskExecutionStatus[] = [];
  taskHistory: Map<string, TaskExecutionHistory> = new Map();
  lastUpdateTime = new Date();
  selectedTaskForDetails: TaskExecutionStatus | null = null;

  private destroy$ = new Subject<void>();

  constructor(private taskScheduler: TaskSchedulerService) {}

  ngOnInit(): void {
    this.refreshStatus();

    // Subscribe to task status updates - only update if we get non-empty status map
    this.taskScheduler.statuses$
      .pipe(takeUntil(this.destroy$))
      .subscribe(statuses => {
        // Only update if we have tasks, otherwise keep the refreshStatus() results
        if (statuses.size > 0) {
          this.taskList = Array.from(statuses.values());
          this.lastUpdateTime = new Date();
        }
      });

    // Subscribe to history updates
    this.taskScheduler.history$
      .pipe(takeUntil(this.destroy$))
      .subscribe(history => {
        this.taskHistory = history;
        this.lastUpdateTime = new Date();
      });
  }

  refreshStatus(): void {
    const statuses = this.taskScheduler.getAllTaskStatuses();
    this.taskList = Array.from(statuses.values());
    this.lastUpdateTime = new Date();
  }

  clearHistory(taskId: string): void {
    if (confirm('Clear execution history for this task?')) {
      this.taskScheduler.clearTaskHistory(taskId);
      this.refreshStatus();
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': '⏳ Pending',
      'running': '🔄 Running',
      'completed': '✅ Completed',
      'failed': '❌ Failed',
      'skipped': '⊘ Skipped'
    };
    return labels[status] || status;
  }

  getTaskHistoryLength(taskId: string): number {
    const history = this.taskHistory.get(taskId);
    return history?.executions?.length || 0;
  }

  getTaskHistoryExecutions(taskId: string): any[] {
    const history = this.taskHistory.get(taskId);
    if (!history?.executions) return [];
    // Return last 5 executions
    return history.executions.slice(-5);
  }

  /**
   * Open details modal for a task execution
   */
  openDetailsModal(task: TaskExecutionStatus): void {
    this.selectedTaskForDetails = task;
  }

  /**
   * Close details modal
   */
  closeDetailsModal(): void {
    this.selectedTaskForDetails = null;
  }

  /**
   * Check if results are in array format
   */
  isArrayResults(results: any): boolean {
    return Array.isArray(results);
  }

  /**
   * Get summary stats for array results (like order results)
   */
  getResultsSummary(results: any): { total: number; success?: number; failed?: number } | null {
    if (!Array.isArray(results)) {
      return null;
    }

    const summary = {
      total: results.length,
      success: 0,
      failed: 0
    };

    results.forEach((item: any) => {
      if (item.success) {
        summary.success!++;
      } else {
        summary.failed!++;
      }
    });

    return summary;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
