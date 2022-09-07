//
//  gamma.swift
//  metal-riemann-zeta
//
//  Created by Botao Pan on 2021/11/25.
//

import Foundation

let g = 9
let p = { (size: Int) -> [complex] in
    let n = Double(size)
    var c: [complex] = []

    var k1_factrl = 1.0
    c.append(complex( sqrt(2.0*Double.pi) ))
    for i in 1 ..< size {
        let k = Double(i)
        let d = n-k
        c.append(complex( exp(d) * pow(d,k-0.5) / k1_factrl ))
        k1_factrl *= -k
    }

    return c
}(g)

func gamma(_ z: complex) -> complex {
    var accm = p[0]
    for k in 1 ..< g {
        accm = accm + p[k] / ( z + complex(k) )
    }
    let t = z + complex(g)
    accm = accm * exp(-t) * pow( t, z + complex(0.5) )
    return accm / z
}
