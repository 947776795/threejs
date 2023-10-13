import { OrbitControls, useFBO, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useLoader,extend } from "@react-three/fiber";
import { Leva, folder, useControls } from "leva";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";
import { range } from "./utils";
import "./scene.css";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

import vertexShader from "./vertexShader";
import fragmentShader from "./fragmentShader";

extend({ TextGeometry })

useGLTF.preload("https://okcest.cool/assets/models/character.gltf");

const Geometries = () => {
  
  const font = useLoader(FontLoader, '/helvetiker_regular.typeface.json')

  const colorMap1 = useLoader(
    TextureLoader,
    "https://okcest.cool/assets/textures/glass-top.webp"
  );
  const colorMap2 = useLoader(
    TextureLoader,
    "https://okcest.cool/assets/textures/glass-bottom.webp"
  );
  const bg = useLoader(TextureLoader, "/1.png");
  // This reference gives us direct access to our mesh
  const mesh = useRef();

  // This is our main render target where we'll render and store the scene as a texture
  const mainRenderTarget = useFBO();
  const scale = 0.6;
  const {
    iorR,
    iorG,
    iorB,
    saturation,
    chromaticAberration,
    refraction
  } = useControls({
    ior: folder({
      iorR: { min: 1.0, max: 2.333, step: 0.001, value: 1.15 },
      iorG: { min: 1.0, max: 2.333, step: 0.001, value: 1.18 },
      iorB: { min: 1.0, max: 2.333, step: 0.001, value: 1.22 }
    }),
    saturation: { value: 1.06, min: 1, max: 1.25, step: 0.01 },

    chromaticAberration: {
      value: 0.5,
      min: 0,
      max: 1.5,
      step: 0.01
    },
    refraction: {
      value: 0.4,
      min: 0,
      max: 1,
      step: 0.01
    }
  });

  const uniforms = useMemo(
    () => ({
      uTexture: {
        value: null
      },
      uIorR: {
        value: 1.0
      },
      uIorG: {
        value: 1.0
      },
      uIorB: {
        value: 1.0
      },
      uRefractPower: {
        value: 0.2
      },
      uChromaticAberration: {
        value: 1.0
      },
      uSaturation: { value: 0.0 },

      winResolution: {
        value: new THREE.Vector2(
          window.innerWidth,
          window.innerHeight
        ).multiplyScalar(Math.min(window.devicePixelRatio, 2)) // if DPR is 3 the shader glitches 🤷‍♂️
      },
      uSceneTexture: {
        value: null
      },
      uResolution: {
        value: { x: 1, y: 1 }
      },
      uScroll: {
        value: 0
      },
      uDiffuse: {
        value: null
      },
      uDistortionScale: {
        value: 0.35
      },
      uDistortionIntensity: {
        value: 0.62
      },
      uIOR: {
        value: 0.6
      },
      uColorShift: {
        value: 0.008
      },
      uRefractIntensity: {
        value: 0.03
      },

      uDiffuseness: {
        value: 0.1
      },
      uShininess: {
        value: 2350
      },
      uSpecularIntensity: {
        value: 0.1
      },
      uLight: {
        value: {
          x: 0,
          y: 100,
          z: -50
        }
      },
      uFresnelPower: {
        value: 7
      },
      uFresnelIntensity: {
        value: 1
      },
      uGlassColor: {
        value: {
          b: 0.67,
          g: 0.97,
          r: 0.1,
          isColor: true
        }
      },
      uGlassColorIntensity: {
        value: 0.6
      }
    }),
    []
  );
  const { nodes, materials } = useGLTF(
    "https://okcest.cool/assets/models/character.gltf"
  );
  console.log(nodes, materials);
  let character = nodes.Scene.clone().children[0];
  const geometry1 = character.children[0].geometry;
  const geometry2 = character.children[1].geometry;

  useFrame((state) => {
    // console.log(mesh.current.material.uniforms.uSceneTexture);
    const { gl, scene, camera } = state;
    scene.background = bg;
    mesh.current.visible = false;
    gl.setRenderTarget(mainRenderTarget);
    gl.render(scene, camera);

    mesh.current.material.uniforms.uTexture.value = mainRenderTarget.texture;
    mesh.current.material.uniforms.uSceneTexture.value =
      mainRenderTarget.texture;

    gl.setRenderTarget(null);
    mesh.current.visible = true;

    mesh.current.material.uniforms.uIorR.value = iorR;
    mesh.current.material.uniforms.uIorG.value = iorG;
    mesh.current.material.uniforms.uIorB.value = iorB;

    mesh.current.material.uniforms.uSaturation.value = saturation;
    mesh.current.material.uniforms.uChromaticAberration.value = chromaticAberration;
    mesh.current.material.uniforms.uRefractIntensity.value = chromaticAberration;
    mesh.current.material.uniforms.uRefractPower.value = refraction;
  });

  const columns = range(-7.5, 7.5, 2.5);
  const rows = range(-7.5, 7.5, 2.5);

  return (
    <>
      <color attach="background" args={["black"]} />

      <mesh position={[-10,3,-10]}>
        <textGeometry args={['OKCEST sdasdas asd asdsad   sadsad  ', { font, size: 1, height: 0.1 }]} />
        <meshStandardMaterial color="black" />
      </mesh>

      <mesh scale={scale} ref={mesh} geometry={geometry1}>
        <shaderMaterial
          key={uuidv4()}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{ ...uniforms, uDiffuse: { value: colorMap1 } }}
        />
      </mesh>
      <mesh scale={scale} ref={mesh} geometry={geometry2}>
        <shaderMaterial
          key={uuidv4()}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{ ...uniforms, uDiffuse: { value: colorMap2 } }}
        />
      </mesh>
    </>
  );
};

const Scene = () => {
  return (
    <>
      <Leva collapsed />
      <Canvas
        camera={{ position: [-3, 0, 6] }}
        dpr={[1, 2]}
        linear={true}
        // orthographic={true}
      >
        <ambientLight intensity={1} />
        <Geometries />
        <OrbitControls />
      </Canvas>
    </>
  );
};

export default Scene;
