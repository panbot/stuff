//
//  MyRenderer.swift
//  metal-zeta-visualize
//
//  Created by Botao Pan on 2021/11/27.
//

import Foundation
import Metal
import MetalKit
import simd
import CoreGraphics

class Renderer: NSObject {

    public let device: MTLDevice

    let cmdq: MTLCommandQueue
    let state: MTLRenderPipelineState

    let camera: PerspectiveCamera

    internal var enabledDepthStencilState: MTLDepthStencilState
    internal var disabledDepthStencilState: MTLDepthStencilState

    public var position = Vec3(0, 10, 0)
    public var orientation = Quaternion.identity
    public var angle: Float = 0;
    public var scale = Vec3(1, 1, 1)
    public var transform: Mat4 {
        let translate = Mat4.translate(position)
        let s = Mat4.scale(scale.x, scale.y, scale.z)
        return translate * orientation.toMat() * s
    }

    let clearColor: MTLClearColor

    let inFlightSemaphore = DispatchSemaphore(value: 1)

    let mesh: Mesh
    let mbgrzs: ManagedBufferGrowingRZS

    let desiredSampleCount = 4
    var sampleCount: Int?

    init?(view: MTKView) {
        guard let device = view.device else {
            print("metal device not present on view")
            return nil
        }
        self.device = device

        if device.supportsTextureSampleCount(desiredSampleCount) {
            sampleCount = desiredSampleCount
            view.sampleCount = desiredSampleCount
        }

        do {
            self.state = try Renderer.makeState(device: device, view: view, sampleCount: sampleCount)
        } catch {
            print(error)
            return nil
        }

        self.cmdq = device.makeCommandQueue()!
        
        clearColor = MTLClearColorMake(0.0, 0.0, 0.0, 1.0)

        camera = PerspectiveCamera(origin: [0, 0, 15],
                                   look: [0, -0.1, -1],
                                   up: [0, 1, 0],
                                   fovYDegrees: 90,
                                   aspectRatio: 1.0,
                                   zNear: 0.001,
                                   zFar: 1000.0)

        let enabledDepthDescriptor = MTLDepthStencilDescriptor()
        enabledDepthDescriptor.isDepthWriteEnabled = true
        enabledDepthDescriptor.depthCompareFunction = .less
        enabledDepthStencilState = device.makeDepthStencilState(descriptor: enabledDepthDescriptor)!

        let disabledDepthDescriptor = MTLDepthStencilDescriptor()
        disabledDepthDescriptor.isDepthWriteEnabled = false
        disabledDepthDescriptor.depthCompareFunction = .less
        disabledDepthStencilState = device.makeDepthStencilState(descriptor: disabledDepthDescriptor)!

//        let pyramid = IndexedPyramid()
//        let pyramid = Pyramid()
//        pyramid.prepare(device: device, size: 2)
//        mesh = pyramid

        mbgrzs = ManagedBufferGrowingRZS(device: device,
                                         vertexCountLimit: 1024 * 1024,
                                         xResolution: 10)
        mesh = mbgrzs
    }


}

extension Renderer: MTKViewDelegate {

    func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
        print("drawableSizeWillChange", size)
        camera.aspectRatio = Float(size.width / size.height)
    }

    func draw(in view: MTKView) {
        guard let descriptor = view.currentRenderPassDescriptor else { return }

        guard let buffer = cmdq.makeCommandBuffer(),
              let encoder = buffer.makeRenderCommandEncoder(descriptor: descriptor),
              let drawable = view.currentDrawable else { return }

        let semaphore = inFlightSemaphore
        _ = semaphore.wait(timeout: DispatchTime.distantFuture)
        buffer.addCompletedHandler({ _ in semaphore.signal() })

        angle += 0.005
        orientation = simd_quatf(angle: angle, axis: [0, 1, 0])

        let attachment = descriptor.colorAttachments[0]
        attachment?.loadAction = .clear
        attachment?.clearColor = clearColor

        encoder.label = "my render encoder"

        let uniformBuffer = device.makeBuffer(length: MemoryLayout<Uniform>.size, options: [])!
        let uniformContents = uniformBuffer.contents().bindMemory(to: Uniform.self, capacity: 1)

        let viewMatrix = camera.viewMatrix
        uniformContents.pointee.view = viewMatrix

        uniformContents.pointee.inverseView = viewMatrix.inverse
        uniformContents.pointee.viewProjection = camera.projectionMatrix * viewMatrix
        let factor = NSScreen.main?.backingScaleFactor ?? 1
        uniformContents.pointee.resolution = [
            Int32(view.frame.size.width * factor),
            Int32(view.frame.size.height * factor)
        ]

        var constants = ModelConstants(modelMatrix: transform,
                                       inverseModelMatrix: simd_inverse(transform))

        encoder.setRenderPipelineState(state)

        encoder.setVertexBuffer(uniformBuffer, offset: 0, index: 0)
        encoder.setVertexBytes(&constants, length: MemoryLayout<ModelConstants>.size, index: 1)

        encoder.setFragmentBuffer(uniformBuffer, offset: 0, index: 0)

//        camera.origin.y = grzs.y + 2
//        grzs.update()
//        grzs.t += 0.01

        if camera.origin.y < 35 && mbgrzs.update(y: camera.origin.y) {
            camera.origin.y += 0.01
        }

        mesh.render(encoder: encoder, vertexBufferIndex: 2)

        encoder.setDepthStencilState(enabledDepthStencilState)

        encoder.endEncoding()

        buffer.present(drawable)

        buffer.commit()
    }

}

extension Renderer {

    class func makeState(device: MTLDevice,
                         view: MTKView,
                         sampleCount: Int?) throws -> MTLRenderPipelineState {

        guard let library = device.makeDefaultLibrary() else {
            throw MyRendererError.badLibrary
        }

        guard let vertexFunction = library.makeFunction(name: "myVertexShader"),
              let fragmentFunction = library.makeFunction(name: "myFragmentShader") else
        {
            throw MyRendererError.badShader
        }

        let d = MTLRenderPipelineDescriptor()
        d.label = "my pipeline"
        d.vertexFunction = vertexFunction
        d.fragmentFunction = fragmentFunction
        d.vertexDescriptor = Renderer.makeVertexDescriptor()

        if let sampleCount = sampleCount {
            d.sampleCount = sampleCount
        }

        d.colorAttachments[0].pixelFormat = view.colorPixelFormat
        d.colorAttachments[0].isBlendingEnabled = true
        d.colorAttachments[0].rgbBlendOperation = .add
        d.colorAttachments[0].alphaBlendOperation = .add
        d.colorAttachments[0].sourceRGBBlendFactor = .sourceColor
        d.colorAttachments[0].sourceAlphaBlendFactor = .sourceAlpha
        d.colorAttachments[0].destinationRGBBlendFactor = .oneMinusSourceAlpha
        d.colorAttachments[0].destinationAlphaBlendFactor = .oneMinusSourceAlpha
        d.depthAttachmentPixelFormat = view.depthStencilPixelFormat
        d.stencilAttachmentPixelFormat = view.depthStencilPixelFormat

        return try device.makeRenderPipelineState(descriptor: d)
    }

    class func makeVertexDescriptor() -> MTLVertexDescriptor {
        let d = MTLVertexDescriptor()

        d.attributes[0].format = .float3
        d.attributes[0].offset = MemoryLayout<VertexIn>.offset(of: \.position)!
        d.attributes[0].bufferIndex = 2

        d.attributes[1].format = .float4
        d.attributes[1].offset = MemoryLayout<VertexIn>.offset(of: \.color)!
        d.attributes[1].bufferIndex = 2

        d.layouts[2].stride = MemoryLayout<VertexIn>.stride

        return d
    }
}

enum MyRendererError: Error {
    case badLibrary
    case badShader
}

struct VertexIn {
    let position: vector_float3
    let color:    vector_float4
}

struct Uniform {
  var time: Float
  var resolution: SIMD2<Int32>
  var view: Mat4
  var inverseView: Mat4
  var viewProjection: Mat4
}

struct ModelConstants {
  var modelMatrix: Mat4
  var inverseModelMatrix: Mat4
}

protocol Mesh {
    func render(encoder: MTLRenderCommandEncoder,
                vertexBufferIndex: Int) -> Void
}

class Pyramid: Mesh {
    var vertexBuffer: MTLBuffer!
    var vertexCount: Int!

    func prepare(device: MTLDevice,
                 size s: Float)
    {
        let r = s / 2

        let p0 = Vec3(  0, s,  0 )
        let p1 = Vec3(  r, 0,  0 )
        let p2 = Vec3(  0, 0,  r )
        let p3 = Vec3( -r, 0,  0 )
        let p4 = Vec3(  0, 0, -r )

        let vertices =  triangle(p0, p2, p1, NSColor.red) +
                        triangle(p0, p3, p2, NSColor.green) +
                        triangle(p0, p4, p3, NSColor.blue) +
                        triangle(p0, p1, p4, NSColor.yellow) +
                        triangle(p1, p3, p4, NSColor.white) +
                        triangle(p1, p2, p3, NSColor.white)

        vertexBuffer = device.makeBuffer(bytes: vertices,
                                         length: MemoryLayout<VertexIn>.stride * vertices.count,
                                         options: [])!
        vertexCount = vertices.count
    }

    func render(encoder: MTLRenderCommandEncoder,
                vertexBufferIndex: Int)
    {
        encoder.setVertexBuffer(vertexBuffer, offset: 0, index: vertexBufferIndex)
        encoder.setFrontFacing(.counterClockwise)
        encoder.setCullMode(.back)
        encoder.drawPrimitives(type: .triangle, vertexStart: 0, vertexCount: vertexCount)

        encoder.setTriangleFillMode(.fill)
    }

    private func triangle(_ p1: vector_float3,
                          _ p2: vector_float3,
                          _ p3: vector_float3,
                          _ color: NSColor) -> [VertexIn]
    {
       return [ VertexIn(position: p1, color: Vec4.from(color.cgColor)),
                VertexIn(position: p2, color: Vec4.from(color.cgColor)),
                VertexIn(position: p3, color: Vec4.from(color.cgColor)) ]
    }

}

class IndexedPyramid: Mesh {

    var vertexBuffer: MTLBuffer!

    var indexBuffer: MTLBuffer!
    var indexCount: Int!

    func prepare(device: MTLDevice,
                 size s: Float)
    {
        let r = s / 2
        let vertices = [ VertexIn(position: [  0, s,  0 ], color: Vec4.from(NSColor.white.cgColor)),
                         VertexIn(position: [  r, 0,  0 ], color: Vec4.from(NSColor.red.cgColor)),
                         VertexIn(position: [  0, 0,  r ], color: Vec4.from(NSColor.blue.cgColor)),
                         VertexIn(position: [ -r, 0,  0 ], color: Vec4.from(NSColor.yellow.cgColor)),
                         VertexIn(position: [  0, 0, -r ], color: Vec4.from(NSColor.green.cgColor)) ]
        vertexBuffer = device.makeBuffer(bytes: vertices,
                                         length: MemoryLayout<VertexIn>.stride * vertices.count,
                                         options: [])!

        let indicies: [UInt16] = [ 0, 1,
                                   0, 2,
                                   0, 3,
                                   0, 4,
                                   1, 2,
                                   2, 3,
                                   3, 4,
                                   4, 1 ]

        indexCount = indicies.count
        indexBuffer = device.makeBuffer(bytes: indicies,
                                        length: MemoryLayout<UInt16>.size * indexCount,
                                        options: [])!
    }

    func render(encoder: MTLRenderCommandEncoder,
                vertexBufferIndex: Int)
    {
        encoder.setVertexBuffer(vertexBuffer, offset: 0, index: vertexBufferIndex)

        encoder.setFrontFacing(.counterClockwise)
        encoder.setCullMode(.none)
        encoder.drawIndexedPrimitives(type: .line,
                                      indexCount: indexCount,
                                      indexType: .uint16,
                                      indexBuffer: indexBuffer,
                                      indexBufferOffset: 0,
                                      instanceCount: 1)
    }
}
