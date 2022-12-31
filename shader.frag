// Author:
// Title:

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_tex0; // tex/1.png
uniform vec2 u_tex0Resolution;

uniform sampler2D u_tex1; // tex/2.png
uniform vec2 u_tex1Resolution;

uniform sampler2D u_tex2; // tex/3.png
uniform vec2 u_tex2Resolution;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;




 



float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}


// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}


#define NUM_OCTAVES 5

float fbm ( in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

vec3 color = vec3 (0.,0.3,0.);

void main (void) {

// x axis infinite scroll with seam
   vec2 st = gl_FragCoord.xy/u_resolution.xy;

  float saw = fract(u_time/10.);
  
 // noise definition
    vec2 q = vec2(0.);
    q.x = fbm( st + 0.00*u_time);
    q.y = fbm( st + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*u_time );
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*u_time);

    float f = fbm(st+r);

    vec3 noise = vec3((f*f*f+.6*f*f+.5*f));

  st.xy *= (noise.xy);

  vec2 stScroll= vec2(fract(st.x+saw), st.y);
  vec2 backwardsScroll = vec2(fract(st.x-saw), fract(st.y-saw));

    // multiply pixel coords by tex
  vec4 color = vec4(stScroll.x,stScroll.y,0.0,1.0);
  vec4 water0 = texture2D(u_tex0,stScroll);
  vec4 water1 = texture2D(u_tex1,backwardsScroll);
  vec4 water2 = texture2D(u_tex2,stScroll);

  vec3 col = water0.rgb;
  col+=water1.rgb*.15;

  // col = WATER MATERIAL 1 ---> water1 overlayed on water0 muttiplied by noise texture 




// now need to generate sdf mesh to apply WATER MATERIAL 1 to....


      //4 : apply color to this fragment
      	gl_FragColor = vec4(col, 1.);
}
