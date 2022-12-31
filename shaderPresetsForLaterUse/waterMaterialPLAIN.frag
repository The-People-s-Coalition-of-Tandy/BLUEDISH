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





vec3 color = vec3 (0.,0.3,0.);

void main (void) {

// x axis infinite scroll with seam
   vec2 st = gl_FragCoord.xy/u_resolution.xy;

  float saw = fract(u_time/10.);
  




  vec2 stScroll= vec2(fract(st.x+saw), st.y);
  vec2 backwardsScroll = vec2(fract(st.x-saw), fract(st.y-saw));


    // multiply pixel coords by tex
  vec4 color = vec4(stScroll.x,stScroll.y,0.0,1.0);
  vec4 water0 = texture2D(u_tex0,stScroll);
  vec4 water1 = texture2D(u_tex1,backwardsScroll);
  vec4 water2 = texture2D(u_tex2,stScroll);

  vec3 col = water0.rgb;
  col+=water1.rgb*.15;



      //4 : apply color to this fragment
      	gl_FragColor = vec4(col, 1.);
}
