import { Injectable } from '@angular/core';

/**
 * Deprecated: Use BackgroundSchedulerService instead
 * This file is kept for build cache compatibility only
 */
@Injectable({
  providedIn: 'root'
})
export class NativeBackgroundService {
  constructor() {
    console.warn('NativeBackgroundService is deprecated. Use BackgroundSchedulerService instead.');
  }
}
