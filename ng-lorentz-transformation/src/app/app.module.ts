import {
  BrowserModule,
} from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import {
  BrowserAnimationsModule,
} from '@angular/platform-browser/animations';
import {
  MatSliderModule,
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
  MatIconModule,
  MatDialogModule,
  MatSelectModule,
} from '@angular/material';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MinkowskiSpaceComponent } from './minkowski-space/minkowski-space.component';
import { FormsModule } from '@angular/forms';
import { EventDialogComponent } from './event-dialog/event-dialog.component';
import { TravellerDialogComponent } from './traveller-dialog/traveller-dialog.component';
import { OffsetDialogComponent } from './offset-dialog/offset-dialog.component';
import { ScenarioDialogComponent } from './scenario-dialog/scenario-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    MinkowskiSpaceComponent,
    EventDialogComponent,
    TravellerDialogComponent,
    OffsetDialogComponent,
    ScenarioDialogComponent,
  ],
  entryComponents: [
    EventDialogComponent,
    TravellerDialogComponent,
    OffsetDialogComponent,
    ScenarioDialogComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatSliderModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
  ],
  providers: [],
  bootstrap: [ AppComponent ],
})
export class AppModule { }
