import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './features/scanner/dashboard.component';
import { PositionsComponent } from './features/positions/positions.component';
import { DebugComponent } from './features/debug/debug.component';
import { SettingsComponent } from './features/settings/settings.component';
import { PAndLComponent } from './features/p-and-l/p-and-l.component';
import { ConfigComponent } from './features/config/config.component';
import { configCanDeactivateGuard } from './core/guards/config-can-deactivate.guard';

const routes: Routes = [
  { path: 'scanner', component: DashboardComponent },
  { path: 'positions', component: PositionsComponent },
  { path: 'pnl', component: PAndLComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'config', component: ConfigComponent, canDeactivate: [configCanDeactivateGuard] },
  { path: 'debug', component: DebugComponent },
  { path: '', redirectTo: '/scanner', pathMatch: 'full' },
  { path: '**', redirectTo: '/scanner' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
