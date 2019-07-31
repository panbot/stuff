import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export type EventDialogData = {
  s: number,
  t: number,
  style: string,
}

@Component({
  templateUrl: './event-dialog.component.html',
})
export class EventDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: EventDialogData,
  ) { }

  ngOnInit() {
  }

  cancel() {
    this.dialogRef.close();
  }

}
