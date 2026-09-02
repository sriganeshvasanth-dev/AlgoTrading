import { Injectable, inject } from '@angular/core';
import { CanDeactivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { ConfigComponent } from '../../features/config/config.component';

/**
 * Guard that prevents navigation from config page if there are unsaved changes
 * Automatically saves valid configuration before allowing navigation
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigCanDeactivateGuard {
  private router = inject(Router);

  canDeactivate(
    component: ConfigComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ): boolean | Promise<boolean> {
    const result = component.canDeactivate(component, currentRoute, currentState, nextState);

    // Handle Observable result
    if (result instanceof Observable) {
      return firstValueFrom(result);
    }

    return result;
  }
}

/**
 * Functional guard for use with standalone routes
 */
export const configCanDeactivateGuard: CanDeactivateFn<ConfigComponent> = (
  component: ConfigComponent,
  currentRoute: ActivatedRouteSnapshot,
  currentState: RouterStateSnapshot,
  nextState?: RouterStateSnapshot
): boolean | Promise<boolean> => {
  const result = component.canDeactivate(component, currentRoute, currentState, nextState);

  // Handle Observable result by converting to Promise
  if (result instanceof Observable) {
    return firstValueFrom(result as Observable<boolean>);
  }

  return result as boolean | Promise<boolean>;
};
