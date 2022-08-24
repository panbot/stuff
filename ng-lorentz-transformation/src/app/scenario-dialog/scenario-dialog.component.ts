import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import scenarios from '../minkowski-space/scenarios';
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
    for (let name of Object.keys(scenarios)) {
      this.scenarios.push({ name, ...scenarios[name] });
    }
  }

  ngOnInit() {
  }

  cancel() {
    this.dialogRef.close();
  }
}
