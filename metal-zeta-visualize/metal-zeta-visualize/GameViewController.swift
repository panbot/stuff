//
//  GameViewController.swift
//  metal-zeta-visualize
//
//  Created by Botao Pan on 2021/11/26.
//

import Cocoa
import MetalKit

// Our macOS specific view controller
class GameViewController: NSViewController {

    var device: MTLDevice!

    var mtkView: MTKView!
    var mtkViewDelegate: MTKViewDelegate!

    override func viewDidLoad() {
        super.viewDidLoad()

        guard let mtkView = self.view as? MTKView else {
            print("View attached to GameViewController is not an MTKView")
            return
        }

        // Select the device to render with.  We choose the default device
        guard let device = MTLCreateSystemDefaultDevice() else {
            print("Metal is not supported on this device")
            return
        }
        self.device = device
        mtkView.device = device

        initZeta(device: device, commandQueue: device.makeCommandQueue()!)

        guard let renderer = Renderer(view: mtkView) else {
            print("cannot init MyRenderer")
            return
        }

        mtkViewDelegate = renderer

        mtkView.delegate = mtkViewDelegate
        mtkViewDelegate.mtkView(mtkView, drawableSizeWillChange: mtkView.drawableSize)
    }
}
