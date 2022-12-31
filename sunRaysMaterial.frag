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





float rect(vec2 p, vec2 size) {  
  vec2 d = abs(p) - size;
  return min(max(d.x, d.y), 0.0) + length(max(d,0.0));
}

vec2 rotate2dToy(vec2 uv, float angle) {
 	return vec2(
        cos(angle)*uv.x - sin(angle)*uv.y, 
        sin(angle)*uv.x + cos(angle)*uv.y
    );
}

float ring(vec2 p, float radius, float width) {
  return abs(length(p) - radius * 0.5) - width;
}

float smoothedge(float v) {
    return smoothstep(0.0, 1.0 / u_resolution.x, v);
}


vec3 color = vec3 (0.,0.3,0.);

void main (void) {

// x axis infinite scroll with seam
   vec2 st = gl_FragCoord.xy/u_resolution.xy;
  st.x *= u_resolution.x/u_resolution.y;


  // shaping function for animation
  
  float angleAnim = (u_time)/1.;

  // COORDS for TEXTURE CENTERING : center st coords so texture can rotate around origin
  vec2 center = (gl_FragCoord.xy - u_resolution *.5 )/ u_resolution.yy;
  vec2 spin = rotate2dToy(center,angleAnim);
  spin+=vec2(.0);


vec2 rect1Dim = vec2(.2,.035);
vec2 rect2Dim = vec2(.2,.035);
//second arg is angle
vec2 rect1angle = rotate2dToy(spin,1.*u_time);
vec2 rect2angle = rotate2dToy(spin,0.);

vec2 offset = vec2(.2);

float rect1 = rect(rect1angle+offset, rect1Dim);
float rect2 = rect(rect2angle-offset, rect2Dim);

rect1 = smoothedge(rect1);
rect2 = smoothedge(rect2);
float rect = rect1 +rect2;
rect = abs(-1.+rect);

vec3 texturedCirc = vec3(abs(-1.+rect1));
texturedCirc+=abs(-1.+rect2);




//load in textures with centered map
  // vec4 texColor = vec4(st.x,st.y,0.0,1.0);
  // vec4 water0 = texture2D(u_tex0,st);
  // vec4 water1 = texture2D(u_tex1,vec2(rect));
  // vec4 water2 = texture2D(u_tex2,st);

  // vec3 texturedCirc = water1.rgb;

 vec3 colorize = vec3(4., 2.70, .0);

  texturedCirc*=colorize;


  //fromscrollling water material
  // float saw = fract(u_time/10.);
  
  // vec2 stScroll= vec2(fract(st.x+saw), st.y);
  // vec2 backwardsScroll = vec2(fract(st.x-saw), fract(st.y-saw));


  //   // multiply pixel coords by tex
  // vec4 color = vec4(stScroll.x,stScroll.y,0.0,1.0);
  // vec4 water0 = texture2D(u_tex0,stScroll);
  // vec4 water1 = texture2D(u_tex1,backwardsScroll);
  // vec4 water2 = texture2D(u_tex2,stScroll);

  // vec3 col = water0.rgb;
  // col+=water1.rgb*.15;



      //4 : apply color to this fragment
      	gl_FragColor = vec4(texturedCirc, 1.);
}
