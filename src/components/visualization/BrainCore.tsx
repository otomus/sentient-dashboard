import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNeuralStore } from "../../stores/neural";

const vertexShader = `
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;
  varying vec2 vUv;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vNormal = normal;
    vPosition = position;
    vUv = uv;

    // Multi-octave noise for organic displacement
    float n1 = snoise(position * 1.5 + uTime * 0.2) * 0.6;
    float n2 = snoise(position * 3.0 - uTime * 0.4) * 0.3;
    float n3 = snoise(position * 6.0 + uTime * 0.8) * 0.1;
    float displacement = (n1 + n2 + n3) * 0.12 * uIntensity;
    vDisplacement = displacement;

    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;
  varying vec2 vUv;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.5);

    // Animated color bands
    float t1 = sin(uTime * 0.3 + vUv.y * 6.0) * 0.5 + 0.5;
    float t2 = sin(uTime * 0.5 + vUv.x * 4.0) * 0.5 + 0.5;
    vec3 baseColor = mix(uColorA, uColorB, t1);
    baseColor = mix(baseColor, uColorC, t2 * 0.15);
    vec3 color = mix(baseColor, vec3(1.0), fresnel * 0.6);

    // Pulsing veins of light
    float vein = abs(sin(vPosition.x * 8.0 + uTime) * sin(vPosition.y * 8.0 - uTime * 0.7) * sin(vPosition.z * 8.0 + uTime * 0.5));
    vein = pow(vein, 4.0) * 2.0;

    float pulse = sin(uTime * 1.5) * 0.05 + 0.95;
    float emission = (0.3 + fresnel * 0.5 + abs(vDisplacement) * 1.5 + vein * 0.5) * uIntensity * pulse;

    // Inner glow core
    float core = pow(max(dot(viewDir, vNormal), 0.0), 2.0) * 0.3;
    color += uColorA * core;

    vec3 final = clamp(color * emission, 0.0, 1.0);
    gl_FragColor = vec4(final, 0.92);
  }
`;

export function BrainCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const brainState = useNeuralStore((s) => s.brainState);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uColorA: { value: new THREE.Color("#7c5bf5") },
      uColorB: { value: new THREE.Color("#a78bfa") },
      uColorC: { value: new THREE.Color("#c084fc") },
    }),
    [],
  );

  useFrame(({ clock }) => {
    if (!materialRef.current || !meshRef.current) return;
    const t = clock.getElapsedTime();

    materialRef.current.uniforms.uTime.value = t;

    // Intensity ramps based on brain state
    const targetIntensity =
      brainState === "idle"
        ? 1.0
        : brainState === "thinking"
          ? 1.4
          : brainState === "acting"
            ? 1.6
            : 1.8;

    const current = materialRef.current.uniforms.uIntensity.value;
    materialRef.current.uniforms.uIntensity.value += (targetIntensity - current) * 0.04;

    // Color shift — stay in purple/lavender palette
    const colorA = materialRef.current.uniforms.uColorA.value;
    const targetColor =
      brainState === "thinking"
        ? new THREE.Color("#a78bfa")
        : brainState === "acting"
          ? new THREE.Color("#c084fc")
          : brainState === "responding"
            ? new THREE.Color("#e0d6ff")
            : new THREE.Color("#7c5bf5");
    colorA.lerp(targetColor, 0.02);

    // Breathing scale
    const breathe = 1.0 + Math.sin(t * 0.8) * 0.03;
    meshRef.current.scale.setScalar(breathe);
    meshRef.current.rotation.y += 0.001;
    meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.08;

  });

  return (
    <group>
      {/* Core brain sphere */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.0, 80]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
        />
      </mesh>

      {/* Inner hot core */}
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#c084fc" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}
