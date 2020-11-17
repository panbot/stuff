import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CapacitorRechargeRoutingModule } from './capacitor-recharge-routing.module';
import { GraphComponent } from './graph/graph.component';
import { MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, MatSelectModule, MatAutocompleteModule } from '@angular/material';
import { TranslateModule } from '../translate/translate.module';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [GraphComponent],
  imports: [
    CommonModule,
    CapacitorRechargeRoutingModule,

    TranslateModule,

    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatAutocompleteModule,

    FormsModule,

  ]
})
export class CapacitorRechargeModule { }
