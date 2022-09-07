//
//  ManagedBufferGrowingRZS.swift
//  metal-zeta-visualize
//
//  Created by Botao Pan on 2021/12/1.
//

import Foundation
import Metal
import AppKit

public class ManagedBufferGrowingRZS {

    let vertexCountLimit: Int

    private let stripVertexOffset: UInt32
    private let stripIndexBuffer: ManagedVertexBuffer<UInt32>

    private let vertexBuffer: ManagedVertexBuffer<VertexIn>

    private let axes: Axes
    private let strip: Strip

    var y: Float = 0

    init(device: MTLDevice,
         vertexCountLimit vcl: Int,
         xResolution xr: UInt32)
    {
        vertexCountLimit = vcl

        axes = Axes(device: device)
        strip = Strip(device: device,
                      vertexCountLimit: vertexCountLimit,
                      xResolution: xr)

        let total = vertexCountLimit + axes.vertices.count
        vertexBuffer = ManagedVertexBuffer<VertexIn>(device: device, limit: total)

        assert(vertexBuffer.add(elements: axes.vertices))

        stripVertexOffset = UInt32(vertexBuffer.count)
        stripIndexBuffer = ManagedVertexBuffer<UInt32>(device: device, limit: vertexCountLimit * 6)
    }

    func update(y: Float) -> Bool
    {
        guard vertexBuffer.add(elements: strip.grow(y: y)) else { return false }

        let width = strip.xResolution * 2 - 1
        if vertexBuffer.count > stripVertexOffset + width {
            let start = UInt32(vertexBuffer.count) - width
            let end   = UInt32(vertexBuffer.count - 1)
            for a in start ..< end {
                let b = a + 1
                let c = b - width
                let d = a - width

                assert(stripIndexBuffer.add(elements: [ a, b, d,
                                                        b, c, d ]))
            }
        }

        return true
    }

    private class ManagedVertexBuffer<T> {
        let unit: Int
        let buffer: MTLBuffer
        var pointer: UnsafeMutablePointer<T>
        let limit: Int
        var count: Int = 0

        init(device: MTLDevice,
             limit: Int)
        {
            self.limit = limit
            unit = MemoryLayout<T>.stride
            buffer = device.makeBuffer(length: unit * limit,
                                       options: .storageModeManaged)!
            pointer = buffer.contents().bindMemory(to: T.self, capacity: limit)
        }

        func add(elements: [T]) -> Bool {
            guard count + elements.count < limit else { return false }

            let before = count
            pointer.assign(from: elements, count: elements.count)
            pointer += elements.count
            count += elements.count
            buffer.didModifyRange(before * unit ..< count * unit)

            return true
        }
    }
}

extension ManagedBufferGrowingRZS: Mesh {

    func render(encoder: MTLRenderCommandEncoder, vertexBufferIndex: Int)
    {
        encoder.setVertexBuffer(vertexBuffer.buffer,
                                offset: 0,
                                index: vertexBufferIndex)

        // axes
        encoder.drawIndexedPrimitives(type: .line,
                                      indexCount: axes.indicies.count,
                                      indexType: .uint32,
                                      indexBuffer: axes.indexBuffer,
                                      indexBufferOffset: 0)

        // the strip
        if stripIndexBuffer.count > 0 {
            encoder.drawIndexedPrimitives(type: .triangle,
                                          indexCount: stripIndexBuffer.count,
                                          indexType: .uint32,
                                          indexBuffer: stripIndexBuffer.buffer,
                                          indexBufferOffset: 0)

        }

        encoder.setFrontFacing(.clockwise)
        encoder.setCullMode(.none)
    }
}

private class Axes {

    let indexBuffer: MTLBuffer
    let indicies: [UInt32] = [ 0, 1,
                               2, 3,
                               4, 5 ]
    let color = Vec4.from(NSColor.white.cgColor)
    let range: Float = 10000;
    var vertices: [VertexIn] {
        get {
            let l = range
            return [ VertexIn(position: [ -l,  0,  0 ], color: color),
                     VertexIn(position: [ +l,  0,  0 ], color: color),
                     VertexIn(position: [  0, -l,  0 ], color: color),
                     VertexIn(position: [  0, +l,  0 ], color: color),
                     VertexIn(position: [  0,  0, -l ], color: color),
                     VertexIn(position: [  0,  0, +l ], color: color) ]
        }
    }

    init(device: MTLDevice)
    {
        indexBuffer = device.makeBuffer(bytes: indicies,
                                        length: MemoryLayout<UInt32>.size * indicies.count,
                                        options: .storageModeManaged)!
        indexBuffer.didModifyRange(0 ..< indicies.count)
    }
}

private class Strip {

    let indexBuffer: MTLBuffer
    let vertexCountLimit: Int
    var indicies: [UInt32] = []

    let alpha: Float = 0.5

    let xResolution: UInt32

    init(device: MTLDevice,
         vertexCountLimit: Int,
         xResolution xr: UInt32)
    {
        self.vertexCountLimit = vertexCountLimit
        indexBuffer = device.makeBuffer(length: MemoryLayout<Int32>.size * vertexCountLimit,
                                        options: .storageModeManaged)!
        xResolution = xr
    }

    func grow(y: Float) -> [VertexIn]
    {
        let resolution = Double(xResolution)

        var vertices: [VertexIn] = []

        // [ xFirst, 0.5 )
        for i: UInt32 in 1 ..< xResolution {
            let k = Double(i) / resolution
            let x = k * 0.5
            let z = zeta(complex( Float80(x), Float80(y) )).float2
            let p = Vec3( z.y, y, z.x )

            let red   = Float(k)
            let green = -red + 1.0

            vertices.append(VertexIn(position: p, color: [ red, green, 0, alpha ] ))
        }

        // [ 0.5, xLast ]
        for i: UInt32 in 0 ..< xResolution {
            let k = Double(i) / resolution
            let x = 0.5 * ( 1.0 + k )
            let z = zeta(complex( Float80(x), Float80(y) )).float2
            let p = Vec3( z.y, y, z.x )

            let red   = Float( -k + 1 )
            let blue  = Float(k)

            vertices.append(VertexIn(position: p, color: [ red, 0, blue, alpha ] ))

        }

        return vertices
    }
}
