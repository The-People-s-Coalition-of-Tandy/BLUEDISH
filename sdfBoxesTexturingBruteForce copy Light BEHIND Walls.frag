// Author:
// Title:

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_tex0; // tex/0.png
uniform vec2 u_tex0Resolution;

uniform sampler2D u_tex1; // tex/1.png
uniform vec2 u_tex1Resolution;

uniform sampler2D u_tex2; // tex/2.png
uniform vec2 u_tex2Resolution;

uniform sampler2D u_tex3; // tex/3.png
uniform vec2 u_tex3Resolution;



uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;


/**
 * Part 3 Challenges
 * - Make the camera move up and down while still pointing at the cube
 * - Make the camera roll (stay looking at the cube, and don't change the eye point)
 * - Make the camera zoom in and out
 */

const int MAX_MARCHING_STEPS = 55;
const float MIN_DIST = 0.0;
const float MAX_DIST = 100.0;
const float EPSILON = 0.0001;

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

/**
 * Signed distance function for a cube centered at the origin
 * with width = height = length = 2.0
 */
float cubeSDF(vec3 p) {
    // If d.x < 0, then -1 < p.x < 1, and same logic applies to p.y, p.z
    // So if all components of d are negative, then p is inside the unit cube
    vec3 d = abs(p) - vec3(1.0, 1.0, 1.0);
    
    // Assuming p is inside the cube, how far is it from the surface?
    // Result will be negative or zero.
    float insideDistance = min(max(d.x, max(d.y, d.z)), 0.0);
    
    // Assuming p is outside the cube, how far is it from the surface?
    // Result will be positive or zero.
    float outsideDistance = length(max(d, 0.0));
    
    return insideDistance + outsideDistance;
}

/**
 * Signed distance function for a sphere centered at the origin with radius 1.0;
 */
float sphereSDF(vec3 p) {
    return length(p) - 1.0;
}

float sdPlane(vec3 p, vec4 n)
{
  // n must be normalized
  return dot(p,n.xyz) + n.w;
} 

//a = rotation angle
mat2 rot (float a){
    float s = sin(a);
    float c = cos(a);
    return mat2(c,-s,s,c);

}

/**
 * ADD OBJECTS HERE 
* Signed distance function describing the scene.
 * 
 * Absolute value of the return value indicates the distance to the surface.
 * Sign indicates whether the point is inside or outside the surface,
 * negative indicating inside.
 */
float sceneSDF(vec3 samplePoint) {
    //translate origin point before drawing cube
    vec3 boxLeftTranslate = samplePoint - vec3(-1.,0.,0.);
    // rotation transform
    boxLeftTranslate.xz *= rot(01.2);
    vec3 boxLeftScale = vec3(.7);
    // (origin, scale) make box Left
    float boxLeft = sdBox(boxLeftTranslate, boxLeftScale);



    vec3 boxRightTranslate = samplePoint -vec3(1.,.0,.0);
    boxRightTranslate.xz *= rot(-01.2);
    vec3 boxRightScale = vec3(.7);
    //make boxRight
    float boxRight = sdBox(boxRightTranslate, boxRightScale);





//sun cube

    vec3 sunBoxTrans = samplePoint - vec3(-0.,.9,-2.);
    // rotation transform
    sunBoxTrans.yz *= rot(-0.2);
    vec3 sunBoxScale = vec3(.1);
        float sunBox = sdBox(sunBoxTrans, sunBoxScale);



//img plane
    vec3 imgBoxTrans = samplePoint - vec3(0.,.0,3.);
    // rotation transform
    // imgCubeTrans.yz *= rot(-0.2);
    vec3 imgBoxScale = vec3(.1);
        float imgBox = sdBox(imgBoxTrans, imgBoxScale);


 

//combine objects to make scene
    float scene = min(boxLeft,boxRight);
    //add sunbox
    scene  = min(scene, sunBox);
    //add plane
    // scene = min(scene,imgBox);

    return  scene;
}

/**
 * Return the shortest distance from the eyepoint to the scene surface along
 * the marching direction. If no part of the surface is found between start and end,
 * return end.
 * 
 * eye: the eye point, acting as the origin of the ray
 * marchingDirection: the normalized direction to march in
 * start: the starting distance away from the eye
 * end: the max distance away from the ey to march before giving up
 */
float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
    float depth = start;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        float dist = sceneSDF(eye + depth * marchingDirection);
        if (dist < EPSILON) {
			return depth;
        }
        depth += dist;
        if (depth >= end) {
            return end;
        }
    }
    return end;
}
            

/**
 * Return the normalized direction to march in from the eye point for a single pixel.
 * 
 * fieldOfView: vertical field of view in degrees
 * size: resolution of the output image
 * fragCoord: the x,y coordinate of the pixel in the output image
 */
vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(fieldOfView) / 2.0);
    return normalize(vec3(xy, -z));
}

/**
 * Using the gradient of the SDF, estimate the normal on the surface at point p.
 */
vec3 estimateNormal(vec3 p) {
    return normalize(vec3(
        sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
        sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
        sceneSDF(vec3(p.x, p.y, p.z  + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
    ));
}

/**
 * Lighting contribution of a single point light source via Phong illumination.
 * 
 * The vec3 returned is the RGB color of the light's contribution.
 *
 * k_a: Ambient color
 * k_d: Diffuse color
 * k_s: Specular color
 * alpha: Shininess coefficient
 * p: position of point being lit
 * eye: the position of the camera
 * lightPos: the position of the light
 * lightIntensity: color/intensity of the light
 *
 * See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
 */
vec3 phongContribForLight(vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye,
                          vec3 lightPos, vec3 lightIntensity) {
    vec3 N = estimateNormal(p);
    vec3 L = normalize(lightPos - p);
    vec3 V = normalize(eye - p);
    vec3 R = normalize(reflect(-L, N));
    
    float dotLN = dot(L, N);
    float dotRV = dot(R, V);
    
    if (dotLN < 0.0) {
        // Light not visible from this point on the surface
        return vec3(0.0, 0.0, 0.0);
    } 
    
    if (dotRV < 0.0) {
        // Light reflection in opposite direction as viewer, apply only diffuse
        // component
        return lightIntensity * (k_d * dotLN);
    }
    return lightIntensity * (k_d * dotLN + k_s * pow(dotRV, alpha));
}

/**
 * Lighting via Phong illumination.
 * 
 * The vec3 returned is the RGB color of that point after lighting is applied.
 * k_a: Ambient color
 * k_d: Diffuse color
 * k_s: Specular color
 * alpha: Shininess coefficient
 * p: position of point being lit
 * eye: the position of the camera
 *
 * See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
 */
vec3 phongIllumination(vec3 k_a, vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye) {
    const vec3 ambientLight = 0.5 * vec3(1.0, 1.0, 1.0);
    vec3 color = ambientLight * k_a;
    
    vec3 light1Pos = vec3(.0 ,
                          .50,
                          .40 );
    vec3 light1Intensity = vec3(1.2);
    
    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light1Pos,
                                  light1Intensity);
    

    //julie and elie light
    vec3 light2Pos = vec3(.0 ,
                          2.0,
                          6.0);
    vec3 light2Intensity = vec3(1.);
    
    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light2Pos,
                                  light2Intensity);    
    return color;
}

/**
 * Return a transform matrix that will transform a ray from view space
 * to world coordinates, given the eye point, the camera target, and an up vector.
 *
 * This assumes that the center of the camera is aligned with the negative z axis in
 * view space when calculating the ray marching direction. See rayDirection.
 */
mat4 viewMatrix(vec3 eye, vec3 center, vec3 up) {
    // Based on gluLookAt man page
    vec3 f = normalize(center - eye);
    vec3 s = normalize(cross(f, up));
    vec3 u = cross(s, f);
    return mat4(
        vec4(s, 0.0),
        vec4(u, 0.0),
        vec4(-f, 0.0),
        vec4(0.0, 0.0, 0.0, 1)
    );
}


// end of raymarch

// water materail start
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

//sun shader funcitons
vec2 rotate2dToy(vec2 uv, float angle) {
 	return vec2(
        cos(angle)*uv.x - sin(angle)*uv.y, 
        sin(angle)*uv.x + cos(angle)*uv.y
    );
}

float circle(in vec2 _st, in float _radius){
    vec2 dist = _st-vec2(0.5);
	return 1.-smoothstep(_radius-(_radius*0.01),
                         _radius+(_radius*0.01),
                         dot(dist,dist)*4.0);
}

float ring(vec2 p, float radius, float width) {
  return abs(length(p) - radius * 0.5) - width;
}



void main(void)
{
	vec3 viewDir = rayDirection(45.0, u_resolution.xy, gl_FragCoord.xy);
    vec3 eye = vec3(0.0, .0, 4.0);
    
    mat4 viewToWorld = viewMatrix(eye, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    
    vec3 worldDir = (viewToWorld * vec4(viewDir, 0.0)).xyz;
    
    float dist = shortestDistanceToSurface(eye, worldDir, MIN_DIST, MAX_DIST);

//water textere start
 vec2 st = gl_FragCoord.xy/u_resolution.xy;
//grab def for sun tex
   vec2 uv = st;

//    grab def for bg generation
    vec2 bg = st;


  float saw = fract(u_time/10.);
  
 // noise definition
    vec2 q = vec2(0.);
    q.x = fbm(st + 0.00*u_time);
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
  vec4 water0 = texture2D(u_tex0,stScroll);
  vec4 water1 = texture2D(u_tex1,backwardsScroll);
  vec4 water2 = texture2D(u_tex2,stScroll);

  vec3 col = water0.rgb;
  col+=water1.rgb*.15;







   //renderer 
    if (dist > MAX_DIST - EPSILON) {
        // Didn't hit anything
        // gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);

//bg gradient
        gl_FragColor = vec4((abs(bg.x-.5)));
		return;
    }


//if object is closer than 1 make it bluedish
if (dist < 1.)
{
    vec4 blueDish = texture2D(u_tex3, uv);


  gl_FragColor = vec4(blueDish);
  return;

}

    if (dist > 5.95) {
          //sun material
//using uv so i dont accidentally fuck with st

    uv.x *= (u_resolution.x/u_resolution.y);


  float sunAnim = (u_time)/10.;
  vec2 center = (gl_FragCoord.xy - u_resolution *.5 )/ u_resolution.yy;
  //brute force center of texture up to the sun object
  center.y+= -.360;
  //scale down to sun size
  center *=5.;
  vec2 spin = rotate2dToy(center,sunAnim);
  spin+=vec2(.5);

// uv.x += .14;
uv.y += -.360;
//define 2d circle
  float radius = .0065;
  float circ = circle(uv.xy, radius);
//   float ring = ring(center.xy, radius+.2, .9-radius); 
//   circ *= ring;

 vec4 water4 = texture2D(u_tex1,spin);
 
  vec3 texturedCirc = circ*water4.rgb;

 vec3 colorize = vec3(4., 2.70, .0);

  texturedCirc*=colorize;


vec4 withAlpha = vec4(texturedCirc,water4.a);

// if (withAlpha.a < .2){
//     discard;
// }


        gl_FragColor = vec4(withAlpha);
		return;
    }





    
    // The closest point on the surface to the eyepoint along the view ray
    vec3 p = eye + dist * worldDir;


//apply WATER texture PHONG

//  * k_a: Ambient color
//  * k_d: Diffuse color
//  * k_s: Specular color
//  * alpha: Shininess coefficient
//  * p: position of point being lit
//  * eye: the position of the camera

    vec3 K_a = vec3(0.0);
    vec3 K_d = water0.rgb;
        // vec3 K_d = vec3(1.,1.,0.);

    vec3 K_s = vec3(.0, .0, .0);
    float shininess = 0.0;
    
    vec3 boxTex = phongIllumination(K_a, K_d, K_s, shininess, p, eye);

//gamma correction
    boxTex*= pow(boxTex, vec3(0.4545));



    gl_FragColor = vec4(boxTex, 1.0);
}


