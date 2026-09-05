import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { DashboardComponent } from './features/scanner/dashboard.component';
import { NavMenuComponent } from './shared/components/nav-menu/nav-menu.component';
import { PositionsComponent } from './features/positions/positions.component';
import { ConfigComponent } from './features/config/config.component';

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DashboardComponent,
    NavMenuComponent,
    PositionsComponent,
    ConfigComponent
  ],
  providers: [
    provideBrowserGlobalErrorListeners()
  ],
  bootstrap: [App]
})
export class AppModule { }
