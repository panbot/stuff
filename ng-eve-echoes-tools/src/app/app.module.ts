import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TurretTrackingModule } from './turret-tracking/turret-tracking.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatIconModule, MatListModule, MatMenuModule } from '@angular/material';
import { NavigationComponent } from './navigation/navigation.component';
import { TranslateModule } from './translate/translate.module';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,

    TurretTrackingModule,

    TranslateModule,

    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatListModule,

    BrowserAnimationsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
