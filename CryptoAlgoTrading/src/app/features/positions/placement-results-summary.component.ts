import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TargetStopLossResult } from '../../core/services/target-stoploss-manager.service';

@Component({
  selector: 'app-placement-results-summary',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './placement-results-summary.component.html',
  styleUrls: ['./placement-results-summary.component.css']
})
export class PlacementResultsSummaryComponent {
  @Input() results: TargetStopLossResult[] = [];
  @Output() closed = new EventEmitter<void>();

  constructor(private cd: ChangeDetectorRef) {}

  get successResults(): TargetStopLossResult[] {
    return this.results.filter(r => r.success);
  }

  get skippedResults(): TargetStopLossResult[] {
    return this.results.filter(r => !r.success && r.message?.includes('Skipped'));
  }

  get actualFailResults(): TargetStopLossResult[] {
    return this.results.filter(r => !r.success && !r.message?.includes('Skipped'));
  }

  get failResults(): TargetStopLossResult[] {
    // Total non-success results for use in other contexts
    return this.results.filter(r => !r.success);
  }

  get successCount(): number {
    return this.successResults.length;
  }

  get failCount(): number {
    return this.failResults.length;
  }

  get successPercentage(): number {
    if (this.results.length === 0) return 0;
    return Math.round((this.successCount / this.results.length) * 100);
  }

  retryFailed(): void {
    // Filter for actual failures only (not skipped orders)
    const actualErrors = this.actualFailResults;
    if (actualErrors.length === 0) {
      alert('No actual failures to retry. Skipped orders need manual cancellation on the exchange.');
      return;
    }
    console.log('Retrying failed orders:', actualErrors);
    alert(`Retry functionality for ${actualErrors.length} failed orders - To be implemented in next version`);
  }

  exportResults(): void {
    const csv = this.generateCSV();
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `placement-results-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  private generateCSV(): string {
    const headers = ['Symbol', 'Product ID', 'Quantity', 'Status', 'Message/Error'];
    const data = this.results.map(r => [
      r.symbol,
      r.productId,
      r.quantity,
      r.success ? 'SUCCESS' : 'FAILED',
      r.message || r.error || ''
    ]);

    const rows = [headers, ...data];
    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  closeResults(): void {
    // Emit close event to parent
    this.closed.emit();
  }
}
