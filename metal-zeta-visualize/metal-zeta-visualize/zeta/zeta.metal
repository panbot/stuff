//
//  File.metal
//  metal-riemann-zeta
//
//  Created by Botao Pan on 2021/11/22.
//

#include <metal_stdlib>
using namespace metal;

float2 zi(float a, float2 s) {
    float b = -s[0];
    float c = -s[1];

    float clna = c * log(a);
    float powab = pow(a, b);

    return {powab * cos(clna),
            powab * sin(clna)};
}

kernel void zeta_shader(device const float2* s [[ buffer(0) ]],
                        device float2* result [[ buffer(1) ]],
                        uint gid [[ thread_position_in_grid ]],
                        uint group_id [[ threadgroup_position_in_grid ]],
                        uint simd_size [[ simdgroups_per_threadgroup ]],
                        uint simd_lane_id [[ thread_index_in_simdgroup ]],
                        uint simd_group_id [[ simdgroup_index_in_threadgroup ]])
{
    threadgroup float partial_re_sums[16];
    threadgroup float partial_im_sums[16];

    assert(simd_size <= 16);

    float index = 3.0 * gid;
    float2 zi1 = zi(index + 1, *s);
    float2 zi2 = zi(index + 2, *s);
    float2 zi3 = zi(index + 3, *s);

    float re = zi1[0] + zi2[0] - 2 * zi3[0];
    float im = zi1[1] + zi2[1] - 2 * zi3[1];

    float partial_re_sum = simd_sum( re );
    float partial_im_sum = simd_sum( im );
    if ( simd_lane_id == 0 ) {
        partial_re_sums[ simd_group_id ] = partial_re_sum;
        partial_im_sums[ simd_group_id ] = partial_im_sum;
    }

    threadgroup_barrier( mem_flags::mem_threadgroup );

    if ( simd_group_id == 0 && simd_lane_id < simd_size ) {
        float re = simd_sum( partial_re_sums[ simd_lane_id ] );
        float im = simd_sum( partial_im_sums[ simd_lane_id ] );
        if ( simd_lane_id == 0 ) {
            result[group_id] = float2( re, im );
        }
    }
}

kernel void sum_shader(device const float2* in [[ buffer(0) ]],
                       device float2* out [[ buffer(1) ]],
                       uint gid [[ thread_position_in_grid ]],
                       uint group_id [[ threadgroup_position_in_grid ]],
                       uint simd_size [[ simdgroups_per_threadgroup ]],
                       uint simd_lane_id [[ thread_index_in_simdgroup ]],
                       uint simd_group_id [[ simdgroup_index_in_threadgroup ]])
{
    threadgroup float partial_re_sums[16];
    threadgroup float partial_im_sums[16];

    assert(simd_size <= 16);

    float2 c = in[gid];

    float partial_re_sum = simd_sum( c.x );
    float partial_im_sum = simd_sum( c.y );
    if ( simd_lane_id == 0 ) {
        partial_re_sums[ simd_group_id ] = partial_re_sum;
        partial_im_sums[ simd_group_id ] = partial_im_sum;
    }

    threadgroup_barrier( mem_flags::mem_threadgroup );

    if ( simd_group_id == 0 && simd_lane_id < simd_size ) {
        float re = simd_sum( partial_re_sums[ simd_lane_id ] );
        float im = simd_sum( partial_im_sums[ simd_lane_id ] );
        if ( simd_lane_id == 0 ) {
            out[group_id] = float2( re, im );
        }
    }
}
