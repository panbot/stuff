//
//  complex.swift
//  metal-riemann-zeta
//
//  Created by Botao Pan on 2021/11/25.
//

import Foundation
import simd

public struct complex {
    var re: Float80
    var im: Float80

    init(_ re: Float80, _ im: Float80) {
        self.re = re
        self.im = im
    }

    init(_ n: Int) {
        self.re = Float80(n)
        self.im = 0
    }

    init(_ re: Double) {
        self.re = Float80(re)
        self.im = 0
    }

    init(_ s: ( Float, Float )) {
        self.re = Float80(s.0)
        self.im = Float80(s.1)
    }

    var float2: simd_float2 {
        get {
            return simd_float2(Float(re), Float(im))
        }
    }
}

extension complex: CustomStringConvertible {
    public var description: String { return "( \(re) + \(im)i )" }
}

func + (a: complex, b: complex) -> complex {
    return complex(a.re + b.re,
                   a.im + b.im)
}

func - (a: complex, b: complex) -> complex {
    return complex(a.re - b.re,
                   a.im - b.im)
}

func * (a: complex, b: complex) -> complex {
    return complex(a.re * b.re - a.im * b.im,
                   a.re * b.im + a.im * b.re)
}

func / (a: complex, b: complex) -> complex {
    let m = b.re * b.re + b.im * b.im
    if m != 0 {
        return complex(a.re / m, a.im / m) * complex(b.re, -b.im)
    } else {
        let r1 = b.re / a.re
        let r2 = b.im / a.re
        let r3 = b.re / a.im
        let r4 = b.im / a.im
        let r = sqrt( 1 / (r1*r1 + r2*r2) + 1 / (r3*r3+r4*r4) )

        let θ = atan(a.im/a.re) - atan(b.im/b.re)

        return complex(r * cos(θ),
                       r * sin(θ))
    }
}

prefix func - (z: complex) -> complex {
    return complex(-z.re, -z.im)
}

func pow(_ base: complex, _ exponent: complex) -> complex {
    let r = abs(base)
    let θ = atan(base.im / base.re)

    return exp(exponent * complex(log(r), θ))
}

func exp(_ z: complex) -> complex {
    let r = exp(z.re)
    let θ = z.im
    return complex(r * cos(θ),
                   r * sin(θ))
}

func abs(_ z: complex) -> Float80 {
    return sqrt(z.re * z.re + z.im * z.im)
}

func sin(_ z: complex) -> complex {
    return complex(sin(z.re) * cosh(z.im),
                   cos(z.re) * sinh(z.im))
}
