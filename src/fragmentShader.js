const fragmentShader = `
uniform float uIorR;
uniform float uIorG;
uniform float uIorB;
uniform float uSaturation;
uniform float uChromaticAberration;
uniform vec2 winResolution;
uniform sampler2D uTexture;
uniform sampler2D uSceneTexture;
uniform sampler2D uDiffuse;
uniform vec2 uResolution;
uniform float uScroll;
uniform float uIOR;
uniform float uRefractIntensity;
uniform float uRefractPower;
uniform float uDistortionScale;
uniform float uDistortionIntensity;
uniform float uSpecularIntensity;
uniform float uShininess;
uniform float uDiffuseness;
uniform vec3 uLight;
uniform float uFresnelPower;
uniform float uFresnelIntensity;
uniform vec3 uGlassColor;
uniform float uGlassColorIntensity;
uniform float uColorShift;


varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vEyeVector;
varying vec3 vNormal;
varying vec3 vPosition;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g_0 = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g_0;
  vec3 i1 = min( g_0.xyz, l.zxy );
  vec3 i2 = max( g_0.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

vec3 sat(vec3 rgb, float intensity) {
  vec3 L = vec3(0.2125, 0.7154, 0.0721);
  vec3 grayscale = vec3(dot(rgb, L));
  return mix(grayscale, rgb, intensity);
}
#define LUMINANCE vec3(0.2125, 0.7154, 0.0721)
#define COLOR_SHIFT_SAMPLE 12



float specular(vec3 light, float shininess, float diffuseness) {
  vec3 normal = vWorldNormal;
  vec3 lightVector = normalize(-light);
  vec3 halfVector = normalize(vEyeVector + lightVector);

  float NdotL = dot(normal, lightVector);
  float NdotH =  dot(normal, halfVector);
  float kDiffuse = max(0.0, NdotL);
  float NdotH2 = NdotH * NdotH;

  float kSpecular = pow(NdotH2, shininess);
  return  kSpecular + kDiffuse * diffuseness;
}

float fresnel(vec3 eyeVector, vec3 worldNormal, float power) {
  float fresnelFactor = abs(dot(eyeVector, worldNormal));
  float inversefresnelFactor = 1.0 - fresnelFactor;
  
  return pow(inversefresnelFactor, power);
}
const int LOOP = 16;

void main() {
  // float iorRatioRed = 1.0/uIorR;
  // float iorRatioGreen = 1.0/uIorG;
  // float iorRatioBlue = 1.0/uIorB;
  gl_FragColor = vec4(vec3(.0), 1.);
  // distortion
  float distortion = uDistortionIntensity * snoise(vPosition * uDistortionScale);
  vec2 uv = gl_FragCoord.xy / winResolution.xy;
  vec3 normal = vWorldNormal;
  vec3 color = vec3(0.0);

  for ( int i = 0; i < LOOP; i ++ ) {
    float slide = float(i) / float(LOOP) * 0.1;

    vec3 refractVecR = refract(vEyeVector, normal + distortion, uIOR);
    vec3 refractVecG = refract(vEyeVector, normal + distortion, uIOR * (1. + uColorShift));
    vec3 refractVecB = refract(vEyeVector, normal + distortion, uIOR * (1. - uColorShift));
    
    // color.r += texture2D(uSceneTexture, uv + refractVecR.xy * (uRefractPower + slide * 1.0) * uRefractIntensity).r;
    // color.g += texture2D(uSceneTexture, uv + refractVecG.xy * (uRefractPower + slide * 2.0) * uRefractIntensity).g;
    // color.b += texture2D(uSceneTexture, uv + refractVecB.xy * (uRefractPower + slide * 3.0) * uRefractIntensity).b;

    // color = sat(color, uSaturation);
    vec4 refractedTextureR = texture2D(uSceneTexture, uv + (uRefractPower + slide * 1.0) * uRefractIntensity * refractVecR.xy);
    vec4 refractedTextureG = texture2D(uSceneTexture, uv + (uRefractPower + slide * 2.0) * uRefractIntensity * refractVecG.xy);
    vec4 refractedTextureB = texture2D(uSceneTexture, uv + (uRefractPower + slide * 3.0) * uRefractIntensity * refractVecB.xy);

    color.r += refractedTextureR.r;
    color.g += refractedTextureG.g;
    color.b += refractedTextureB.b;

  }

  // Divide by the number of layers to normalize colors (rgb values can be worth up to the value of LOOP)
  // color /= float( LOOP );
  // Divide by the number of layers to normalize colors (rgb values can be worth up to the value of COLOR_SHIFT_SAMPLE)
  color.rgb /= float( LOOP );

  // gl_FragColor = vec4(color, 1.0);

  // Specular
  // float specularLight = specular(uLight, uShininess, uDiffuseness);
  // gl_FragColor += specularLight * uSpecularIntensity;
  // Specular
  float specularLight = specular(uLight, uShininess, uDiffuseness);
  color += specularLight;
  // gl_FragColor = vec4(color, 1.0);

  // Fresnel
  // float f = uFresnelIntensity * fresnel(vEyeVector, normal, uFresnelPower);
  // color += f * vec4(.55);
  // color.rgb += f * vec3(1.0);
  // Fresnel
  float f = uFresnelIntensity * fresnel(vEyeVector, normal, uFresnelPower);
  color.rgb += f * vec3(1.0);

  // gl_FragColor = vec4(color, 1.0);

  // color based on diffuseMap
  gl_FragColor = texture2D(uDiffuse, vUv);
  vec3 diffuse = texture2D(uDiffuse, vUv).rgb;
  diffuse.r = pow(diffuse.r, uGlassColorIntensity);
  diffuse.g = pow(diffuse.g, uGlassColorIntensity);
  diffuse.b = pow(diffuse.b, uGlassColorIntensity);
  color.rgb *= diffuse;
  gl_FragColor = vec4(color, 1.0);

}
`;

export default fragmentShader;
