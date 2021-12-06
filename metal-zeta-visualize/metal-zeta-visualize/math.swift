//
//  math.swift
//  metal-zeta-visualize
//
//  Created by Botao Pan on 2021/11/27.
//

import Foundation
import simd
import GLKit

/// Simple math utilities
public final class Math {

  private init() { }

  /// Converts degrees to radians
  public static func toRadians(_ degrees: Float) -> Float {
    return degrees * .pi / 180.0
  }

  /// Converts radians to degrees
  public static func toDegrees(_ radians: Float) -> Float {
    return radians * 180.0 / .pi
  }

  /**
   Returns a matrix that converts points from world space to eye space
   */
  public static func makeLook(
    eye: Vec3,
    look: Vec3,
    up: Vec3
  ) -> Mat4 {

    let target = eye + look
    let glLook = GLKMatrix4MakeLookAt(
      eye.x,
      eye.y,
      eye.z,
      target.x,
      target.y,
      target.z,
      up.x,
      up.y,
      up.z
    )
    return GLKMatrix4.toFloat4x4(matrix: glLook)
  }

  /// Returns a perspective projection matrix, to convert world space to Metal clip space
  public static func makePerspective(
    fovyDegrees fovy: Float,
    aspectRatio: Float,
    nearZ: Float,
    farZ: Float
  ) -> Mat4 {

    let persp = GLKMatrix4MakePerspective(
      Math.toRadians(fovy),
      aspectRatio,
      nearZ,
      farZ
    )
    return GLKMatrix4.toFloat4x4(matrix: persp)
  }
}

extension GLKMatrix4 {
  static func toFloat4x4(matrix: GLKMatrix4) -> float4x4 {
    return float4x4(
      Vec4(matrix.m00, matrix.m01, matrix.m02, matrix.m03),
      Vec4(matrix.m10, matrix.m11, matrix.m12, matrix.m13),
      Vec4(matrix.m20, matrix.m21, matrix.m22, matrix.m23),
      Vec4(matrix.m30, matrix.m31, matrix.m32, matrix.m33))
  }
}

public typealias Mat4 = float4x4

extension Mat4 {
  public static let identity = float4x4(Float(1.0))
}

extension Mat4 {

  /// Creates a scale matrix with the diagonal set to scaleX, scaleY, scaleZ
  public static func scale(_ scaleX: Float, _ scaleY: Float, _ scaleZ: Float) -> Mat4 {
    return Mat4(diagonal: [scaleX, scaleY, scaleZ, 1])
  }

  /// Creates a matrix that rotates around the origin using the specified axis and angle
  public static func rotate(radians: Float, axis: Vec3) -> Mat4 {
    return Mat4(Quaternion(angle: radians, axis: axis))
  }

  /// Creates a translation matrix
  public static func translate(_ translation: Vec3) -> Mat4 {
    return Mat4(columns:(Vec4(1, 0, 0, 0),
                         Vec4(0, 1, 0, 0),
                         Vec4(0, 0, 1, 0),
                         Vec4(translation, 1))
    )
  }
}

public typealias Vec2 = SIMD2<Float>
public typealias Vec2UI = SIMD2<UInt32>
public typealias Vec2I = SIMD2<Int>
public typealias Vec3 = SIMD3<Float>
public typealias Vec3I = SIMD3<Int>
public typealias Vec4 = SIMD4<Float>

extension Vec3 {

  init(v: Vec3I) {
    self.init(Float(v.x), Float(v.y), Float(v.z))
  }

  /// Returns a vector with random x,y,z values between -1 and 1
  public static func random() -> Vec3 {
    return [
      Float.random(in: -1.0...1.0),
      Float.random(in: -1.0...1.0),
      Float.random(in: -1.0...1.0)
    ]
  }

  public func to4(w: Float) -> Vec4 {
    return Vec4(self.x, self.y, self.z, w)
  }
}

extension Vec3I {
  func toFloat() -> Vec3 {
    return [Float(self.x), Float(self.y), Float(self.z)]
  }
}
extension Vec4 {

  /// Given a CGColor returns a Vec4 with x,y,z,w set to r,g,b,a
  public static func from(_ color: CGColor) -> Vec4 {
    guard let c = color.components else {
      return Vec4.zero
    }

    if c.count == 2 {
      return [Float(c[0]), Float(c[0]), Float(c[0]), Float(c[1])]
    }

    return [Float(c[0]), Float(c[1]), Float(c[2]), Float(c[3])]
  }

  public func to3() -> Vec3 {
    return Vec3(self.x, self.y, self.z)
  }
}

public typealias Quaternion = simd_quatf

extension Quaternion {
  public static let identity = simd_quatf(angle: 0, axis: [1, 0, 0])

  public func toMat() -> Mat4 {
    var m = Mat4(self)
    m[3][3] = 1
    return m
  }
}
