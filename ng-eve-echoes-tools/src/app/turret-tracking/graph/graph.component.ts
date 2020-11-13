import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CanvasGraph } from './canvas-graph';

@Component({
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {

  @ViewChild('canvas', { static: true })
  canvasRef: ElementRef<HTMLCanvasElement>;

  graph: CanvasGraph;

  velocity: number;
  tracking: number;
  optimal: number;
  falloff: number;
  signature: number = 100;

  constructor(
    private hostRef: ElementRef<HTMLElement>,
  ) { }

  ngOnInit() {
    this.graph = new CanvasGraph(
      this.canvasRef.nativeElement,
      this.hostRef.nativeElement.clientWidth,
      this.hostRef.nativeElement.clientHeight,
    );
  }

  draw() {
    this.graph.clear();

    this.graph.drawGrid(this.optimal + 3 * this.falloff);

    let hitChance = (range: number) => {
      let a = 40 * this.velocity / range / this.tracking / this.signature;
      let b = Math.max(0, range - this.optimal) / this.falloff;

      return Math.pow(0.5, a * a + b * b)
    }
    this.graph.plot(hitChance, 'lightblue');

    let dmg = (range: number) => {
      let chance = hitChance(range);
      return 0.5 * Math.min(
        chance * chance + 0.98 * chance + 0.0501,
        6 * chance
      )
    }
    this.graph.plot(dmg, 'red');
  }

}
