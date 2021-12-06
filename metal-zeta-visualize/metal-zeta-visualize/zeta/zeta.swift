//
//  zeta.swift
//  metal-riemann-zeta
//
//  Created by Botao Pan on 2021/11/22.
//

import Foundation
import Metal

let half  = complex(0.5)
let one   = complex(1)
let three = complex(3)
let pi    = complex(3.1415926535897932384626433)

let floatSize = MemoryLayout<Float>.size
let float2Size = MemoryLayout<( Float, Float )>.stride

var zetaFunction: MTLFunction!;
var zetaState   : MTLComputePipelineState!;

var sumFunction: MTLFunction!;
var sumState   : MTLComputePipelineState!;

var commandQueue: MTLCommandQueue!;

public func initZeta(device: MTLDevice, commandQueue cmdQ: MTLCommandQueue) {
    guard let library = device.makeDefaultLibrary() else { abort("failed to create library") }

    guard let f = library.makeFunction(name: "zeta_shader") else { abort("zeta shader not found") }
    guard let s = try? device.makeComputePipelineState(function: f) else { abort("failed to make zeta pipeline state")}

    zetaFunction = f
    zetaState    = s

    guard let f = library.makeFunction(name: "sum_shader") else { abort("sum shader not found") }
    guard let s = try? device.makeComputePipelineState(function: f) else { abort("failed to make sum pipeline state")}

    sumFunction = f
    sumState    = s

    commandQueue = cmdQ
}

public func zeta(_ s: complex) -> complex
{
    if (s.re < 0.5) {
        return gamma( half - half * s ) /
               gamma( half * s ) *
                zeta( one - s ) *
                 pow( pi, s - half )
    }

    let batchSize = zetaState.maxTotalThreadsPerThreadgroup;

    let n = batchSize * 1024;

    guard let cmdBuf = commandQueue.makeCommandBuffer(),
          let cmdEnc = cmdBuf.makeComputeCommandEncoder() else { abort("failed to make command") }

    // first pass
    cmdEnc.setComputePipelineState(zetaState)

    var inBuf = ( Float(s.re), Float(s.im) )
    cmdEnc.setBytes(&inBuf, length: float2Size, index: 0)

    let sum0BufSize = n / batchSize + 1
    guard let sum0Buf = commandQueue.device.makeBuffer(length: float2Size * sum0BufSize, options: .storageModePrivate) else { abort("failed to make sum0 buffer") }
    cmdEnc.setBuffer(sum0Buf, offset: 0, index: 1)

    cmdEnc.dispatchThreads(
        MTLSizeMake(n, 1, 1),
        threadsPerThreadgroup: MTLSizeMake(min(n, zetaState.maxTotalThreadsPerThreadgroup), 1, 1))

    // sum pass 1
    cmdEnc.setComputePipelineState(sumState)

    cmdEnc.setBuffer(sum0Buf, offset: 0, index: 0)

    let sum1BufSize = sum0BufSize / batchSize + 1
    guard let sum1Buf = commandQueue.device.makeBuffer(length: float2Size * sum1BufSize, options: .storageModePrivate) else { abort("failed to make sum1 buffer" ) }
    cmdEnc.setBuffer(sum1Buf, offset: 0, index: 1)

    cmdEnc.dispatchThreads(
        MTLSizeMake(sum0BufSize, 1, 1),
        threadsPerThreadgroup: MTLSizeMake(min(sum0BufSize, zetaState.maxTotalThreadsPerThreadgroup), 1, 1))

    // sum pass 2
    cmdEnc.setComputePipelineState(sumState)

    cmdEnc.setBuffer(sum1Buf, offset: 0, index: 0)

    guard let sumBuf = commandQueue.device.makeBuffer(length: float2Size, options: []) else { abort("failed to make result buffer" ) }
    cmdEnc.setBuffer(sumBuf, offset: 0, index: 1)

    cmdEnc.dispatchThreads(
        MTLSizeMake(sum1BufSize, 1, 1),
        threadsPerThreadgroup: MTLSizeMake(min(sum1BufSize, zetaState.maxTotalThreadsPerThreadgroup), 1, 1))

    cmdEnc.endEncoding()

    cmdBuf.commit()
    cmdBuf.waitUntilCompleted()

    let result = sumBuf.contents().load(as: ( Float, Float ).self)
    return z3(s) * complex(result)
}

func z3(_ s: complex) -> complex {
    return one / ( one - pow( three, one - s ) )
}
