import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service to manage executor handlers for scheduled tasks
 * This allows tasks to be registered globally but have their actual
 * implementation provided by PositionsComponent when it loads
 */
@Injectable({
  providedIn: 'root'
})
export class TaskExecutorService {
  // Executors for tasks
  private placeTargetStopLossExecutor$ = new BehaviorSubject<(() => Promise<void>) | null>(null);
  private updateTrailingStopLossExecutor$ = new BehaviorSubject<(() => Promise<void>) | null>(null);

  constructor() {}

  /**
   * Register the actual executor for place-target-stopLoss task
   * Called by PositionsComponent when it's ready
   */
  registerPlaceTargetStopLossExecutor(executor: () => Promise<void>): void {
    console.log('✅ [TaskExecutorService] Registered real executor for place-target-stopLoss');
    this.placeTargetStopLossExecutor$.next(executor);
  }

  /**
   * Register the actual executor for update-trailing-stopLoss task
   * Called by PositionsComponent when it's ready
   */
  registerUpdateTrailingStopLossExecutor(executor: () => Promise<void>): void {
    console.log('✅ [TaskExecutorService] Registered real executor for update-trailing-stopLoss');
    this.updateTrailingStopLossExecutor$.next(executor);
  }

  /**
   * Get the current executor for place-target-stopLoss
   */
  getPlaceTargetStopLossExecutor(): (() => Promise<void>) | null {
    return this.placeTargetStopLossExecutor$.value;
  }

  /**
   * Get the current executor for update-trailing-stopLoss
   */
  getUpdateTrailingStopLossExecutor(): (() => Promise<void>) | null {
    return this.updateTrailingStopLossExecutor$.value;
  }

  /**
   * Observable for place-target-stopLoss executor changes
   */
  getPlaceTargetStopLossExecutor$(): Observable<(() => Promise<void>) | null> {
    return this.placeTargetStopLossExecutor$.asObservable();
  }

  /**
   * Observable for update-trailing-stopLoss executor changes
   */
  getUpdateTrailingStopLossExecutor$(): Observable<(() => Promise<void>) | null> {
    return this.updateTrailingStopLossExecutor$.asObservable();
  }
}
