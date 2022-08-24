import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  XY,
  MinkowskiSpaceCoordinates as ST,
  LorentzTransformation,
  st, st0,
} from './models';
import { MatDialog } from '@angular/material';
import { EventDialogComponent, EventDialogData } from '../event-dialog/event-dialog.component';
import { TravellerDialogComponent, TravellerDialogData } from '../traveller-dialog/traveller-dialog.component';
import { OffsetDialogComponent, OffsetDialogData } from '../offset-dialog/offset-dialog.component';
import { ScenarioDialogComponent, ScenarioDialogData } from '../scenario-dialog/scenario-dialog.component';

export type MinkowskiSpaceEvent = {
  st: ST,
  style: any,
}

export type MinkowskiSpaceTraveller = {
  origin: ST,
  velocity?: number,
  destination?: ST,
  style: any,
}

export type MinkowskiSpaceScenario = {
  events?: MinkowskiSpaceEvent[],
  travellers?: MinkowskiSpaceTraveller[],
}

@Component({
  selector: 'app-minkowski-space',
  templateUrl: './minkowski-space.component.html',
  styleUrls: ['./minkowski-space.component.scss']
})
export class MinkowskiSpaceComponent implements OnInit {

  radius = 50;

  boost = 0;
  lt = new LorentzTransformation(this.boost);

  offset = st(0, 0);

  events: MinkowskiSpaceEvent[] = [];
  travellers: MinkowskiSpaceTraveller[] = [];

  @ViewChild('canvas', { static: true })
  canvasRef: ElementRef<HTMLCanvasElement>;

  view: MinkowskiSpaceDrawable;

  lightStyle = 'rgba(255, 200, 0, 0.5)';

  detail = false;

  constructor(
    private hostRef: ElementRef<HTMLElement>,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.view = new CanvasView(
      this.canvasRef.nativeElement,
      this.hostRef.nativeElement.clientWidth,
      this.hostRef.nativeElement.clientHeight,
      this.radius,
    );

    this.view.setTransform((before: ST) => {
      let after = before.subtract(this.offset.s, this.offset.t);
      return this.lt.transform(after);
    });

    this.boost = 0;

    this.redraw();
  }

  addRandomEvent() {
    this.addEvent(Math.floor(10 * Math.random()), Math.floor(10 * Math.random()), 'red');
  }

  addEvent(s: number, t: number, style: any) {
    this.events.push({
      st: st(s, t),
      style,
    });
    this.redraw();
  }

  addTraveller(
    origin: ST,
    velocity: number,
    destination: ST,
    style: any,
  ) {
    this.travellers.push({
      origin,
      velocity,
      destination,
      style,
    });
    this.redraw();
  }

  redraw() {
    this.view.clear();

    this.view.drawGrid();

    this.drawTraveller(
      this.offset,
      1,
      this.lightStyle,
    );
    this.drawTraveller(
      this.offset,
      -1,
      this.lightStyle,
    );

    for (let { st, style } of this.events) {
      this.view.dotST(st, style);
    }

    for (let t of this.travellers) {
      if (t.destination) {
        this.view.lineST(t.origin, t.destination, t.style);
      } else {
        this.drawTraveller(t.origin, t.velocity, t.style);
      }
    }
  }

  drawTraveller(from: ST, v: number, style) {
    const to = from.add(v * this.radius, this.radius);

    this.view.lineST(from, to, style);
  }

  openEventDialog() {
    const dialogRef = this.dialog.open(EventDialogComponent, {
      width: '250px',
      data: { s: null, t: null, style: '' },
    });

    dialogRef.afterClosed().subscribe((result: EventDialogData) => {
      this.addEvent(result.s, result.t, result.style);
    });
  }

  openTravellerDialog() {
    const dialogRef = this.dialog.open(TravellerDialogComponent, {
      width: '250px',
      data: { fromS: null, fromT: null, toS: null, toT: null, velocity: null, style: '' },
    });

    dialogRef.afterClosed().subscribe((result: TravellerDialogData) => {
      let origin = st(result.fromS, result.fromT);
      let destination: ST;
      let velocity: number = result.velocity;
      let style: string = result.style;

      if (result.toS != null && result.toT != null) {
        destination = st(result.toS, result.toT);
      }

      this.addTraveller(origin, velocity, destination, style);
    });
  }

  openOffsetDialog() {
    const dialogRef = this.dialog.open(OffsetDialogComponent, {
      width: '250px',
      data: { s: this.offset.s, t: this.offset.t },
    });

    dialogRef.afterClosed().subscribe((result: OffsetDialogData) => {
      let { s, t } = result;

      let update = false;

      if (!isNaN(s) && this.offset.s != s) {
        this.offset.s = s;
        update = true;
      }

      if (!isNaN(t) && this.offset.t != t) {
        this.offset.t = t;
        update = true;
      }

      if (update) this.redraw();
    });
  }

  openScenarioDialog() {
    const dialogRef = this.dialog.open(ScenarioDialogComponent, {
      width: '250px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: ScenarioDialogData) => {
      let { events, travellers } = result.scenario;
      this.events = [].concat(events || []);
      this.travellers = [].concat(travellers || []);

      this.redraw();
    });
  }

  updateBoost(b) {
    b = parseFloat(b);
    if (isNaN(b)) return;

    b = Math.min(0.9, Math.max(-0.9, b));

    this.boost = b;

    this.lt = new LorentzTransformation(b);

    this.redraw();
  }

}

interface MinkowskiSpaceDrawable {
  setTransform(transform: (ST) => ST);
  dotST(st: ST, style: any, text?: string);
  lineST(from: ST, to: ST, style: any);
  drawGrid();
  clear();
}

class CanvasView implements MinkowskiSpaceDrawable {

  ctx: CanvasRenderingContext2D;

  origin: XY;

  gridSize = [ 40, 40 ];
  gridStyle = 'rgba(200, 200, 200, 0.5)';

  dotSize = 3;

  transform = (st: ST) => st;

  constructor(
    public canvas: HTMLCanvasElement,
    public width: number,
    public height: number,
    public radius: number,
  ) {
    this.origin = {
      x: width / 2,
      y: height / 2,
    };

    this.ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;

    const translateY = this.height / 2 - 400 / dpr;

    this.origin = {
      x: this.width / 2,
      y: this.height / 2 + translateY,
    };

    this.canvas.width = this.width * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.height = this.height * dpr;
    this.canvas.style.height = this.height + 'px';

    this.ctx.scale(dpr, dpr);
    // this.ctx.translate(0, translateY);

    this.gridSize[0] = Math.min(this.gridSize[0], this.width / 2 / 7);
    this.gridSize[1] = this.gridSize[0];
  }

  clear() {
    // this.ctx.save();
    // this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // this.ctx.restore();

    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  setTransform(t: (st: ST) => ST) {
    this.transform = t;
  }

  drawGrid() {
    for (let t = 0; t < this.radius; ++t) {
      this.lineST(
        st(-this.radius, t),
        st(this.radius, t),
        this.gridStyle,
      )
    }

    for (let s = -this.radius; s < this.radius; ++s) {
      this.lineST(
        st(s, 0 ),
        st(s, this.radius),
        this.gridStyle,
      )
    }

    this.dotST(st0, this.gridStyle);

    const style = 'rgba(100, 100, 100, 0.5)';
    this.lineXY(
      this.origin,
      { x: this.width / 2, y: this.origin.y - this.radius * this.gridSize[1] },
      style,
    );
    this.lineXY(
      { x: 0, y: this.origin.y },
      { x: this.width, y: this.origin.y },
      style,
    );
  }

  dotST(st: ST, style: any, text?: string) {
    st = this.transform(st);
    if (!text) {
      text = `(${st.s.toFixed(2)}, ${st.t.toFixed(2)})`;
    }

    this.dotXY(this.st2xy(st), style, text);
  }

  dotXY(xy: XY, style: any, text?: string) {
    this.ctx.save();

    const { x, y } = xy;

    this.ctx.beginPath();
    this.ctx.arc(x, y, this.dotSize, 0, 2 * Math.PI);
    this.ctx.closePath();
    this.ctx.fillStyle = style;
    this.ctx.fill();

    if (text) {
      this.ctx.strokeStyle = style;
      this.ctx.strokeText(text, x + 2, y + 10);
    }

    this.ctx.restore();
  }

  lineST(from: ST, to: ST, style: any) {
    this.lineXY(
      this.st2xy(this.transform(from)),
      this.st2xy(this.transform(to)),
      style,
    );
  }

  lineXY(from: XY, to: XY, style: any) {
    this.ctx.save();

    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.closePath();
    this.ctx.strokeStyle = style;
    this.ctx.stroke();

    this.ctx.restore();
  }

  st2xy(st: ST) {
    return {
      x: this.origin.x + st.s * this.gridSize[0],
      y: this.origin.y - st.t * this.gridSize[1],
    }
  }

}
