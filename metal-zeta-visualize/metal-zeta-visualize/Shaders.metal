//
//  MyShaders.metal
//  metal-zeta-visualize
//
//  Created by Botao Pan on 2021/11/27.
//

#include <metal_stdlib>
using namespace metal;

struct VertexIn
{
    float3 position [[ attribute(0) ]];
    float4 color    [[ attribute(1) ]];
};

struct VertexOut
{
    float4 position [[ position ]];
    float4 color;
    float pointSize [[ point_size ]];
};

struct Uniforms {
    float time;
    int2 resolution;
    float4x4 view;
    float4x4 inverseView;
    float4x4 viewProjection;
};

struct ModelConstants {
    float4x4 modelMatrix;
    float4x4 inverseModelMatrix;
};

vertex VertexOut
myVertexShader(const VertexIn in [[ stage_in ]],
               const device Uniforms& uniforms [[ buffer(0) ]],
               const device ModelConstants& constants [[ buffer(1) ]])
{
    VertexOut out;
    out.position = uniforms.viewProjection * constants.modelMatrix * float4(in.position, 1.0);
    out.color = in.color;
    out.pointSize = 5;

    return out;
}

fragment float4
myFragmentShader(VertexOut in [[ stage_in ]],
                 bool is_front [[ front_facing ]])
{
//    return in.color;
    if (is_front) return in.color;
    else return in.color * 0.5;
}

