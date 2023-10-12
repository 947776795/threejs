import { OrbitControls, useFBO,useGLTF,Environment } from "@react-three/drei";
import { Canvas, useFrame,useLoader } from "@react-three/fiber";
import { useMemo, useRef,useEffect } from "react";
import * as THREE from "three";
import { v4 as uuidv4 } from "uuid";
import { range } from './utils';
import { Leva, folder, useControls } from "leva";
import './scene.css';
import { TextureLoader } from 'three/src/loaders/TextureLoader'

import vertexShader from './vertexShader';
import fragmentShader from './fragmentShader';

const Geometries = () => {
  // This reference gives us direct access to our mesh
  const mesh = useRef();
  const backgroundGroup = useRef();
  const { nodes, materials } = useGLTF("/character.gltf");
  const [bottom,top] = useLoader(TextureLoader, [
    '/glass-bottom.webp',
    '/glass-top.webp',
    // '/okcc-bg.jpeg'
  ])
  const textureLoader = new THREE.TextureLoader();
  // 加载/okcc-bg.jpeg 显示的不太对
  // 并且加载的纹理颜色感觉有问题
  // 加载背景图片
  const texture = textureLoader.load('/2.png');
  console.log(texture,'texturetexture')


  // This is our main render target where we'll render and store the scene as a texture
  const mainRenderTarget = useFBO();
  const backRenderTarget = useFBO();

  const {
    light,
    // 亮度
    shininess,
    // 扩散度
    diffuseness,
    // 菲涅尔系数
    fresnelPower,
    iorR,
    iorY,
    iorG,
    iorC,
    iorB,
    iorP,
    saturation,
    chromaticAberration,
    refraction
  } = useControls({
    light: {
      value: new THREE.Vector3(-1.0, 1.0, 1.0)
    },
    diffuseness: {
      value: 0.2
    },
    shininess: {
      value: 40.0
    },
    fresnelPower: {
      value: 8.0,
    },
    ior: folder({
      iorR: { min: 1.0, max: 2.333, step: 0.001, value: 1.15 },
      iorY: { min: 1.0, max: 2.333, step: 0.001, value: 1.16 },
      iorG: { min: 1.0, max: 2.333, step: 0.001, value: 1.18 },
      iorC: { min: 1.0, max: 2.333, step: 0.001, value: 1.22 },
      iorB: { min: 1.0, max: 2.333, step: 0.001, value: 1.22 },
      iorP: { min: 1.0, max: 2.333, step: 0.001, value: 1.22 },
    }),
    // 饱和度
    saturation: { value: 1.06, min: 1, max: 1.25, step: 0.01 },
    chromaticAberration: {
      value: 0.5,
      min: 0,
      max: 1.5,
      step: 0.01,
    },
    refraction: {
      value: 0.4,
      min: 0,
      max: 1,
      step: 0.01,
    },
  })

  const uniforms = useMemo(() => ({
    uTexture: {
      value: null,
    },
    uIorR: { value: 1.0 },
    uIorY: { value: 1.0 },
    uIorG: { value: 1.0 },
    uIorC: { value: 1.0 },
    uIorB: { value: 1.0 },
    uIorP: { value: 1.0 },
    uRefractPower: {
      value: 0.2,
    },
    uChromaticAberration: {
      value: 1.0
    },
    uShininess: { value: 40.0 },
    uDiffuseness: { value: 0.2 },
    uFresnelPower: { value: 8.0 },
    uLight: {
      value: new THREE.Vector3(-1.0, 1.0, 1.0)
    },
    uSaturation: { value: 0.0 },
    uGlassColorIntensity: {
      value: {
        value: .6,
        min: 0,
        max: 3,
        step: .01
      }
    },
    uDiffuse: {
      value: top
    },
    winResolution: {
      value: new THREE.Vector2(
        window.innerWidth,
        window.innerHeight
      ).multiplyScalar(Math.min(window.devicePixelRatio, 2)), // if DPR is 3 the shader glitches 🤷‍♂️
    },
  }), [])

  useFrame((state) => {
    const { gl, scene, camera } = state;
      // 创建一个纹理图片加载器加载图片
    // scene.background = new THREE.Color('skyblue')
    scene.background = texture
    mesh.current.visible = false;

    mesh.current.material.uniforms.uFresnelPower.value = fresnelPower;

    mesh.current.material.uniforms.uDiffuseness.value = diffuseness;
    mesh.current.material.uniforms.uShininess.value = shininess;
    mesh.current.material.uniforms.uLight.value = new THREE.Vector3(
      light.x,
      light.y,
      light.z
    );

    mesh.current.material.uniforms.uIorR.value = iorR;
    mesh.current.material.uniforms.uIorY.value = iorY;
    mesh.current.material.uniforms.uIorG.value = iorG;
    mesh.current.material.uniforms.uIorC.value = iorC;
    mesh.current.material.uniforms.uIorB.value = iorB;
    mesh.current.material.uniforms.uIorP.value = iorP;

    mesh.current.material.uniforms.uSaturation.value = saturation;
    mesh.current.material.uniforms.uChromaticAberration.value = chromaticAberration;
    mesh.current.material.uniforms.uRefractPower.value = refraction;


    gl.setRenderTarget(backRenderTarget);
    gl.render(scene, camera);

    mesh.current.material.uniforms.uTexture.value = backRenderTarget.texture;
    mesh.current.material.side = THREE.BackSide;

    mesh.current.visible = true;

    gl.setRenderTarget(mainRenderTarget);
    gl.render(scene, camera);

    mesh.current.material.uniforms.uTexture.value = mainRenderTarget.texture;
    mesh.current.material.side = THREE.FrontSide;
    // console.log(top,'top',mesh.current.material)
    // mesh.current.material.uniforms.uDiffuse = top;

    gl.setRenderTarget(null);
    mesh.current.visible = true;

  });

  const columns = range(-7.5, 7.5, 2.5);
  const rows = range(-7.5, 7.5, 2.5);

  return (
    <>
      {/* <color attach="background" args={["black"]} /> */}
      {/* <group ref={backgroundGroup}>
        {columns.map((col, i) =>
          rows.map((row, j) => (
            <mesh position={[col, row, -4]}>
              <icosahedronGeometry args={[0.333, 8]} />
              <meshStandardMaterial color="white" />
            </mesh>
          ))
        )}
      </group> */}
      <group dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.haut.geometry}
        material={nodes.haut.material}
        ref={mesh}
        // map={top}
      >
        <shaderMaterial
          key={uuidv4()}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.bas.geometry}
        material={nodes.bas.material}
        map={bottom}
        ref={mesh}
      >
        <shaderMaterial
          key={uuidv4()}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </group>
      {/* <mesh ref={mesh}>
        <icosahedronGeometry args={[3, 20]} />
        <torusGeometry args={[3, 1, 32, 100]} />
        <shaderMaterial
          key={uuidv4()}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh> */}
    </>
  );
};

const Scene = () => {
  return (
    <Canvas camera={{ position: [10, 19, 6] }} dpr={[1, 2]}>
      <ambientLight intensity={1.0} />
      <Geometries />
      <OrbitControls />
    </Canvas>
  );
};


export default Scene;

useGLTF.preload("/character.gltf");