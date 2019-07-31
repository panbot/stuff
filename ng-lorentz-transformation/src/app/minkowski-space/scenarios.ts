import { MinkowskiSpaceScenario } from './minkowski-space.component';
import { st, st0 } from './models';

export const twins: MinkowskiSpaceScenario = {
    name: 'twins',
    events: [
        { st: st(3, 5), style: 'red' },
        { st: st(0, 3.2), style: 'blue' },
        { st: st(0, 6.8), style: 'blue' },
        { st: st(0, 10), style: 'purple' },
    ],
    travellers: [
        { origin: st0, destination: st(3, 5), style: 'red' },
        { origin: st(3, 5), destination: st(0, 10), style: 'red' },
        { origin: st0, destination: st(0, 10), style: 'blue' },
    ],
}

export const poleAndBarn: MinkowskiSpaceScenario = {
    name: 'pole & barn',
    events: [
        { st: st(-6, 10), style: 'purple' },
        { st: st(-4, 10), style: 'purple' },
        { st: st(-4, 8.8), style: 'purple' },
    ],
    travellers: [
        { origin: st(-6, 0), velocity: 0, style: 'blue' },
        { origin: st(-4, 0), velocity: 0, style: 'blue' },
        { origin: st(0, 0), velocity: -0.6, style: 'red' },
        { origin: st(2, 0), velocity: -0.6, style: 'red' },
    ]
}
