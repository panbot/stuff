import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import * as scenarios from '../minkowski-space/scenarios';
import { MinkowskiSpaceScenario } from '../minkowski-space/minkowski-space.component';

export type ScenarioDialogData = {
  scenario: MinkowskiSpaceScenario,
}

@Component({
  templateUrl: './scenario-dialog.component.html',
})
export class ScenarioDialogComponent implements OnInit {

  scenarios = [];

  constructor(
    public dialogRef: MatDialogRef<ScenarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: ScenarioDialogData,
  ) {
    for (let key of Object.keys(scenarios)) {
      this.scenarios.push(scenarios[key]);
    }
  }

  ngOnInit() {
  }

  cancel() {
    this.dialogRef.close();
  }
}
