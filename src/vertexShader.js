const vertexShader = `
#define GLSLIFY 1
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying vec3 vNormal;
varying vec3 vEyeVector;

void main() {




  vUv = uv;

  vPosition = position;


  vec4 worldPos = modelMatrix * vec4(position, 1.0);

  vec4 mvPosition = viewMatrix * worldPos;

  vEyeVector = normalize(worldPos.xyz - cameraPosition);


  vec3 transformedNormal = normalMatrix * normal;
    
  vWorldNormal = normalize(transformedNormal);


  vNormal = normal;

  // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

  gl_Position = projectionMatrix * mvPosition;
}
`;

export default vertexShader;
