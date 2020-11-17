import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TurretTrackingRoutingModule } from './turret-tracking-routing.module';
import { GraphComponent } from './graph/graph.component';

import {
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatButtonModule,
  MatIconModule,
  MatCardModule,
  MatAutocompleteModule,
} from '@angular/material';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '../translate/translate.module';

@NgModule({
  declarations: [GraphComponent],
  imports: [
    CommonModule,
    TurretTrackingRoutingModule,

    TranslateModule,

    FormsModule,

    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatAutocompleteModule,

  ]
})
export class TurretTrackingModule { }
