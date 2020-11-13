import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TurretTrackingRoutingModule } from './turret-tracking-routing.module';
import { GraphComponent } from './graph/graph.component';

import {
  MatSliderModule,
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
  MatIconModule,
  MatCardModule,
} from '@angular/material';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [GraphComponent],
  imports: [
    CommonModule,
    TurretTrackingRoutingModule,

    FormsModule,

    MatSliderModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,

  ]
})
export class TurretTrackingModule { }
