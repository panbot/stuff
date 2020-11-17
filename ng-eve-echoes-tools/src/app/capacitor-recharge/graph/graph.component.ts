import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LanguageService } from 'src/app/language.service';

@Component({
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {

  @ViewChild('canvas', { static: true })
  canvasRef: ElementRef<HTMLCanvasElement>;

  graph: CanvasGraph;

  capacity: number;
  time: number;
  skills: number;
  rig1: number;
  rig2: number;
  rig3: number;

  finalCap: number;
  finalTime: number;

  collapsed = false;

  rigs = [
    [ 'No Rigs', 0 ],

    [ 'SMC Prototype', 10.5 ],
    [ 'SMC I', 17.5 ],
    [ 'SMC II', 20 ],
    [ 'SMC III', 22.5 ],

    [ 'CCC Prototype', -7.5 ],
    [ 'CCC I', -12.5 ],
    [ 'CCC II', -15 ],
    [ 'CCC III', -17.5 ],
  ];

  storeKey = 'capacitor-recharge-parameters';

  constructor(
    private hostRef: ElementRef<HTMLElement>,
    private languageService: LanguageService,
  ) { }

  ngOnInit() {
    this.graph = new CanvasGraph(
      this.canvasRef.nativeElement,
      this.hostRef.nativeElement.clientWidth,
      this.hostRef.nativeElement.clientHeight,
    );

    try {
      let paramters = JSON.parse(localStorage.getItem(this.storeKey));
      Object.assign(this, paramters);
    } catch {}
  }

  draw() {
    let cap = this.capacity;

    if (this.skills) cap += this.capacity * this.skills / 100;

    if (this.rig1 > 0) cap += this.capacity * this.rig1 / 100;
    if (this.rig2 > 0) cap += this.capacity * this.rig2 / 100;
    if (this.rig3 > 0) cap += this.capacity * this.rig3 / 100;

    this.finalCap = Math.floor(cap);

    let time = this.time;

    if (this.rig1 < 0) time *= 1 + this.rig1 / 100;
    if (this.rig2 < 0) time *= 1 + this.rig2 / 100;
    if (this.rig3 < 0) time *= 1 + this.rig3 / 100;

    this.finalTime = Math.floor(time);

    let recharge = (p: number) => 10 * cap / time * (Math.sqrt(p / 100) - p / 100);

    this.graph.plot(
      { x: 100, y: cap / time * 3 },
      recharge,
      'red',
    );

    localStorage.setItem(this.storeKey, JSON.stringify({
      capacity: this.capacity,
      time: this.time,
      skills: this.skills,
      rig1: this.rig1,
      rig2: this.rig2,
      rig3: this.rig3,
    }));

  }
}

type XY = { x: number, y: number };

class CanvasGraph {

  ctx: CanvasRenderingContext2D;

  origin: XY;

  paddingTop = 30;
  paddingRight = 30;
  paddingLeft = 50;
  paddingBottom = 30;

  gridWidth: number;
  gridHeight: number;

  axis = {
    font: '12px',
    fontStyle: 'rgb(100, 100, 100)',
    gridStyle: 'rgba(200, 200, 200, 0.5)',
    majorStepX: 1,
    majorStepY: 1,
  };

  range: XY = {
    x: 100,
    y: 100,
  };

  constructor(
    public canvas: HTMLCanvasElement,
    public width: number,
    public height: number,
  ) {
    this.origin = {
      x: this.paddingLeft,
      y: height - this.paddingBottom,
    };

    this.ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = this.width * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.height = this.height * dpr;
    this.canvas.style.height = this.height + 'px';

    this.ctx.scale(dpr, dpr);

    this.gridWidth = width - this.paddingLeft - this.paddingRight;
    this.gridHeight = height - this.paddingTop - this.paddingBottom;
  }

  plot(range: XY, func: (r: number) => number, style: string) {
    this.range = range;

    this.clear();
    this.drawGrid();

    let step = this.range.x / this.gridWidth;
    let sMax = -Infinity;
    let rMax: number;
    for (let r0 = 0; r0 < this.range.x; r0 += step) {
      let s0 = func(r0);
      if (s0 > sMax) {
        sMax = s0;
        rMax = r0;
      }
      let r1 = r0 + step;
      let s1 = func(r1);

      this.lineXY(
        this.transform(r0, s0),
        this.transform(r1, s1),
        style,
      );
    }

    this.dotXY(
      this.transform(rMax, sMax),
      3,
      style,
      `${rMax.toFixed(1)}%, ${sMax.toFixed(2)} GJ/s`,
    );
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawGrid() {
    this.findMajorStepX();
    this.findMajorStepY();

    // vertical lines
    for (let x = 0 ; x <= this.range.x; x += this.axis.majorStepX) {
      this.lineXY(
        this.transform(x, 0),
        this.transform(x, this.range.y),
        this.axis.gridStyle,
      );
    }

    // horizontal lines
    for (let y = 0; y <= this.range.y; ++y) {
      this.lineXY(
        this.transform(0, y),
        this.transform(this.range.x, y),
        this.axis.gridStyle,
      );
    }

    this.ctx.save();
    this.ctx.fillStyle = this.axis.fontStyle;
    this.ctx.font = this.axis.font;

    for (let x = 0; x < this.range.x; x += this.axis.majorStepX) {
      const pos = this.transform(x, 0);
      let text = `${x}%`;
      let measure = this.ctx.measureText(text);
      this.ctx.fillText(text, pos.x, pos.y + measure.actualBoundingBoxAscent + 2);
    }

    for (let y = 0; y < this.range.y; y += this.axis.majorStepY) {
      const pos = this.transform(0, y);
      let text = `${y} GJ/s`;
      let measure = this.ctx.measureText(text);
      this.ctx.fillText(text, pos.x - measure.width - 2, pos.y + measure.actualBoundingBoxAscent / 2);

    }

    this.ctx.restore();
  }

  transform(r: number, s: number): XY {
    return {
      x: this.origin.x + r / this.range.x * this.gridWidth,
      y: this.origin.y - s / this.range.y * this.gridHeight,
    }
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

  dotXY(xy: XY, size: number, style: any, text?: string) {
    this.ctx.save();

    const { x, y } = xy;

    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, 2 * Math.PI);
    this.ctx.closePath();
    this.ctx.fillStyle = style;
    this.ctx.fill();

    if (text) {
      this.ctx.strokeStyle = style;
      this.ctx.strokeText(text, x + 2, y - 5);
    }

    this.ctx.restore();
  }

  private findMajorStepX() {
    this.ctx.save();
    this.ctx.font = this.axis.font;

    let size = this.ctx.measureText('100%').width;
    let step = 1;
    for (; this.range.x / step * size > this.gridWidth; step *= 10);
    this.axis.majorStepX = step;
    this.ctx.restore();
  }

  private findMajorStepY() {
    this.ctx.save();
    this.ctx.font = this.axis.font;

    let size = this.ctx.measureText('GJ/s').actualBoundingBoxAscent;
    let step = 1;
    for (; this.range.y / step * size > this.gridHeight; step *= 10);
    this.axis.majorStepY = step;
    this.ctx.restore();
  }
}
