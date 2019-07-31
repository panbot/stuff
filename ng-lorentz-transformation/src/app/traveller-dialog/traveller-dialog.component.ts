import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export type TravellerDialogData = {
  fromS: number,
  fromT: number,
  toS: number,
  toT: number,
  velocity: number,
  style: string,
}

@Component({
  templateUrl: './traveller-dialog.component.html',
})
export class TravellerDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<TravellerDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: TravellerDialogData,
  ) { }

  ngOnInit() {
  }

  cancel() {
    this.dialogRef.close();
  }
}
