import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export type OffsetDialogData = {
  s: number,
  t: number,
}

@Component({
  templateUrl: './offset-dialog.component.html',
})
export class OffsetDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<OffsetDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: OffsetDialogData,
  ) { }

  ngOnInit() {
  }

  cancel() {
    this.dialogRef.close();
  }

}
