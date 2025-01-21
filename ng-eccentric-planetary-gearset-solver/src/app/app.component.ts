import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  title = 'eccentric-planetary-gearset-solver';

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(
    elementRef: ElementRef<HTMLElement>,
  ) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d') ?? bail('2d context not available');

    const init_canvas = () => {
      const size = elementRef.nativeElement.getBoundingClientRect();
      if (size.width && size.height) {
        let styles = elementRef.nativeElement.computedStyleMap();
        this.canvas.width = size.width - (styles.get('padding-left') as CSSUnitValue).value - (styles.get('padding-right') as CSSUnitValue).value;
        this.canvas.height = size.height - (styles.get('padding-top') as CSSUnitValue).value - (styles.get('padding-bottom') as CSSUnitValue).value;

        elementRef.nativeElement.append(this.canvas);
        this.redraw();
      } else {
        setTimeout(init_canvas, 10);
      }
    }

    init_canvas();
  }

  animation = {
    stopped: true,
    handle: 0,
    step: 0.005,
    angle: 0,
  }

  sizes = {
    ring: 62,
    south: 30,
    center: 20,
    east: 17,
  };

  solution = {
    step: 0.1,
    value: 162.5,
    threshold: 1e-3,
    delta: Infinity,
  };

  reset() {
    this.ctx.resetTransform();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.setTransform(1, 0, 0, -1, this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.rotate(Math.PI / -2);
  }

  redraw() {
    this.animation.angle = 0;
    if (this.animation.handle) cancelAnimationFrame(this.animation.handle);

    const solve = () => {
      this.reset();

      let ring = new Gear(this.sizes.ring, 'red');
      ring.rotation = 0;
      ring.draw(this.ctx);

      let south = new Gear(this.sizes.south, 'green');
      south.roll_inside(ring, this.animation.angle);
      south.draw(this.ctx);

      const solution = rad(this.solution.value);

      let center = new Gear(this.sizes.center, 'blue');
      center.roll_outside(south, solution + vector2.to_polar(south.position)[1] - south.rotation);
      center.draw(this.ctx);

      let east = new Gear(this.sizes.east, 'cyan');
      let east_angle = vector2.to_polar(east.tangent(ring, center)[0])[1];
      east.roll_inside(ring, east_angle);
      east.draw(this.ctx);

      let west_angle = vector2.to_polar(vector2.minus(center.position, east.position))[1];
      let center2 = new Gear(this.sizes.center, 'yellow');
      center2.roll_outside(east, west_angle - east_angle + vector2.to_polar(east.position)[1] - east.rotation);
      center2.draw(this.ctx);

      let unit = Math.PI * 2 / center.size;
      let delta = Math.abs(Math.abs(center2.rotation - center.rotation) % unit);
      delta = Math.min(delta, unit - delta);

      if (delta > this.solution.threshold) {
        if (delta < this.solution.delta) {
        } else {
          this.solution.step /= -2;
        }
        this.solution.value += this.solution.step;
        this.solution.delta = delta;
        requestAnimationFrame(solve);
      } else {
        console.log('solution:', this.solution.value);
        render();
      }
    }

    const render = () => {
      this.reset();

      let ring = new Gear(this.sizes.ring, 'red');
      ring.rotation = 0;
      ring.draw(this.ctx);

      let south = new Gear(this.sizes.south, 'green');
      south.roll_inside(ring, this.animation.angle);
      south.draw(this.ctx);

      const solution = rad(this.solution.value);

      let center = new Gear(this.sizes.center, 'blue');
      center.roll_outside(south, solution + vector2.to_polar(south.position)[1] - south.rotation);
      center.draw(this.ctx);

      let east = new Gear(this.sizes.east, 'cyan');
      let east_angle = vector2.to_polar(east.tangent(ring, center)[0])[1];
      east.roll_inside(ring, east_angle);
      east.draw(this.ctx);

      let north = new Gear(ring.size - south.size - center.size, 'yellow');
      north.roll_inside(ring, solution + this.animation.angle);
      north.draw(this.ctx);

      let west = new Gear(ring.size - east.size - center.size, 'orange');
      let west_angle = vector2.to_polar(vector2.minus(center.position, east.position))[1];
      west.roll_inside(ring, west_angle);
      west.draw(this.ctx);

      this.animation.angle += this.animation.step;
      if (!this.animation.stopped) this.animation.handle = requestAnimationFrame(render);
    }

    solve();
  }
}

const scale = 5;
const tooth_size = 20;

class Gear {

  position: vector2.Vector = [ 0, 0 ];
  rotation = 0;

  constructor(
    public size: number,
    public color: string,
  ) {

  }

  roll_inside(gear: Gear, angle: number) {
    this.position = vector2.add(gear.position, vector2.to_cartesion([
      (gear.size - this.size) * scale,
      gear.rotation + angle,
    ]));
    this.rotation = gear.rotation - angle * (gear.size / this.size - 1);

    return this;
  }

  roll_outside(gear: Gear, angle: number) {
    this.position = vector2.add(gear.position, vector2.to_cartesion([
      (gear.size + this.size) * scale,
      gear.rotation + angle,
    ]));
    this.rotation = Math.PI + gear.rotation + angle * (gear.size / this.size + 1);

    return this
  }

  tangent(inside: Gear, outside: Gear) {
    let r1 = (inside.size - this.size) * scale;
    let r2 = (outside.size + this.size) * scale;
    let R_squared = vector2.square(vector2.minus(inside.position, outside.position));
    if (R_squared == 0) return [];

    let v1 = vector2.scale(vector2.add(inside.position, outside.position), 0.5);

    let a = (r1 * r1 - r2 * r2) / (2 * R_squared);
    let v2 = vector2.scale(vector2.minus(outside.position, inside.position), a);

    let b = 2 * (r1 * r1 + r2 * r2) / R_squared - Math.pow((r1 * r1 - r2 * r2) / R_squared, 2) - 1;
    if (b < 0) return [];

    let [ x1, y1 ] = inside.position;
    let [ x2, y2 ] = outside.position;
    let v3 = vector2.scale([ y2 - y1, x1 - x2 ], 0.5 * Math.sqrt(b));

    return [
      vector2.add  (vector2.add(v1, v2), v3),
      vector2.minus(vector2.add(v1, v2), v3),
    ]
  }

  draw(ctx: CanvasRenderingContext2D) {
    let r = this.size * scale;

    let path = new Path2D();
    path.arc(0, 0, r, 0, Math.PI * 2);
    path.closePath();

    path.moveTo(0, 0);
    path.lineTo(...vector2.to_cartesion([ r, 0 ]));

    for (let i = 1; i < this.size; ++i) {
      let start: vector2.Vector = [
        r - tooth_size,
        Math.PI * 2 / this.size * i,
      ];
      path.moveTo(...vector2.to_cartesion(start));
      path.lineTo(...vector2.to_cartesion([
        r,
        start[1],
      ]));
    }

    ctx.save();
    ctx.translate(this.position[0], this.position[1]);
    ctx.rotate(this.rotation);
    ctx.strokeStyle = this.color;
    ctx.stroke(path);
    ctx.restore();
  }
}

function rad(deg: number) {
  return deg / 360 * Math.PI * 2;
}

function deg(rad: number) {
  return rad / Math.PI * 180;
}

namespace vector2 {
  export type Vector = [ number, number ];

  export function add(a: Vector, b: Vector): Vector {
    return [
      a[0] + b[0],
      a[1] + b[1],
    ]
  }

  export function minus(a: Vector, b: Vector): Vector {
    return [
      a[0] - b[0],
      a[1] - b[1],
    ]
  }

  export function scale(v: Vector, factor: number): Vector {
    return [ v[0] * factor, v[1] * factor ];
  }

  export function square(v: Vector) {
    return v[0] * v[0] + v[1] * v[1];
  }

  export function mod(v: Vector) {
    return Math.sqrt(square(v));
  }

  export function to_polar(cartesion: Vector): Vector {
    let angle = Math.atan(cartesion[1] / cartesion[0]);
    if (cartesion[0] < 0) angle = Math.PI + angle;
    if (angle < 0) angle += Math.PI * 2;
    return [
      mod(cartesion),
      angle,
    ]
  }

  export function to_cartesion(polar: Vector): Vector {
    return [
      polar[0] * Math.cos(polar[1]),
      polar[0] * Math.sin(polar[1]),
    ]
  }
}

function bail(msg: string): never {
  throw new Error(msg);
}
