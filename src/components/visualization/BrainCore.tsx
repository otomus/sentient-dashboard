import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNeuralStore } from "../../stores/neural";

/**
 * Tron-style disc vertex shader.
 * Passes UV, position, and normal to the fragment shader for circuit pattern generation.
 */
const vertexShader = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normal;
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Tron-style disc fragment shader.
 * Creates concentric rings, radial segments, circuit traces, and edge glow
 * reminiscent of the Tron identity disc.
 */
const fragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);

    // Disc-space polar coordinates from UV center
    vec2 center = vUv - 0.5;
    float dist = length(center) * 2.0;
    float angle = atan(center.y, center.x);

    // Concentric rings — sharp Tron-style bands
    float ring1 = smoothstep(0.02, 0.0, abs(dist - 0.3));
    float ring2 = smoothstep(0.02, 0.0, abs(dist - 0.55));
    float ring3 = smoothstep(0.015, 0.0, abs(dist - 0.75));
    float ring4 = smoothstep(0.025, 0.0, abs(dist - 0.92));
    float rings = ring1 + ring2 + ring3 + ring4;

    // Radial segment dividers — 12 segments like a clock face
    float segments = 12.0;
    float segLine = smoothstep(0.03, 0.0, abs(mod(angle / 6.2832 * segments, 1.0) - 0.5) - 0.47);
    segLine *= step(0.2, dist); // suppress near center

    // Rotating data pulse — arc traveling along outer ring
    float pulseAngle = mod(angle + uTime * 1.5, 6.2832);
    float pulse = smoothstep(0.8, 1.0, dist) * smoothstep(0.3, 0.0, pulseAngle) * 2.0;

    // Secondary counter-rotating pulse
    float pulseAngle2 = mod(angle - uTime * 0.8 + 3.14, 6.2832);
    float pulse2 = smoothstep(0.5, 0.65, dist) * smoothstep(0.45, 0.0, pulseAngle2) * 1.5;

    // Circuit trace pattern — angular data lines between rings
    float trace1 = smoothstep(0.01, 0.0, abs(center.x)) * step(0.3, dist) * step(dist, 0.55) * 0.6;
    float trace2 = smoothstep(0.01, 0.0, abs(center.y)) * step(0.55, dist) * step(dist, 0.75) * 0.6;
    float trace3 = smoothstep(0.01, 0.0, abs(center.x - center.y)) * step(0.15, dist) * step(dist, 0.4) * 0.4;
    float trace4 = smoothstep(0.01, 0.0, abs(center.x + center.y)) * step(0.15, dist) * step(dist, 0.4) * 0.4;

    // Animated data bits traveling along traces
    float dataBit1 = step(0.95, sin(dist * 40.0 - uTime * 8.0)) * trace1 * 2.0;
    float dataBit2 = step(0.95, sin(dist * 40.0 + uTime * 6.0)) * trace2 * 2.0;

    // Center core — glowing hub
    float core = smoothstep(0.15, 0.0, dist) * 1.5;
    float coreRing = smoothstep(0.01, 0.0, abs(dist - 0.12)) * 1.2;

    // Edge rim glow — Fresnel-like effect for the disc edge
    float edgeGlow = smoothstep(0.85, 1.0, dist) * 0.8;

    // Combine all circuit elements
    float pattern = rings + segLine * 0.4 + pulse + pulse2
                  + trace1 + trace2 + trace3 + trace4
                  + dataBit1 + dataBit2
                  + core + coreRing + edgeGlow;

    // Color mixing — primary for structure, secondary for pulses, tertiary for data
    vec3 color = uColorA * (rings + segLine * 0.4 + coreRing + edgeGlow)
               + uColorB * (pulse + pulse2 + core)
               + uColorC * (dataBit1 + dataBit2 + trace1 + trace2 + trace3 + trace4);

    // Overall intensity modulation
    float intensity = pattern * uIntensity;

    // Subtle breathing pulse
    intensity *= 0.95 + sin(uTime * 0.8) * 0.05;

    // Fade to transparent at disc edge
    float alpha = smoothstep(1.0, 0.95, dist) * 0.92;

    vec3 final = clamp(color * intensity, 0.0, 1.5);
    gl_FragColor = vec4(final, alpha * step(0.001, intensity));
  }
`;

const STATE_COLORS: Record<string, THREE.Color> = {
  thinking: new THREE.Color("#00d4ff"),
  acting: new THREE.Color("#00ff88"),
  responding: new THREE.Color("#00a8cc"),
  idle: new THREE.Color("#0066aa"),
};

const STATE_INTENSITIES: Record<string, number> = {
  idle: 1.0,
  thinking: 1.4,
  acting: 1.6,
  responding: 1.8,
};

const LERP_THRESHOLD = 0.001;

/** Animated 3D Tron-style identity disc with circuit patterns and state-reactive colors. */
export function BrainCore() {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const brainState = useNeuralStore((s) => s.brainState);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uColorA: { value: new THREE.Color("#0066aa") },
      uColorB: { value: new THREE.Color("#00d4ff") },
      uColorC: { value: new THREE.Color("#00ff88") },
    }),
    [],
  );

  useFrame(({ clock }) => {
    if (!materialRef.current || !groupRef.current) return;
    const t = clock.getElapsedTime();

    materialRef.current.uniforms.uTime.value = t;

    // Intensity ramps based on state
    const targetIntensity = STATE_INTENSITIES[brainState] ?? 1.0;
    const current = materialRef.current.uniforms.uIntensity.value;
    const intensityDelta = targetIntensity - current;
    if (Math.abs(intensityDelta) > LERP_THRESHOLD) {
      materialRef.current.uniforms.uIntensity.value += intensityDelta * 0.04;
    }

    // Color shift
    const colorA = materialRef.current.uniforms.uColorA.value;
    const targetColor = STATE_COLORS[brainState] ?? STATE_COLORS.idle;
    if (colorA.getHexString() !== targetColor.getHexString()) {
      colorA.lerp(targetColor, 0.02);
    }

    // Steady disc rotation — tilted like a Tron disc
    groupRef.current.rotation.y += 0.003;
    groupRef.current.rotation.x = Math.PI * 0.15 + Math.sin(t * 0.2) * 0.03;
  });

  return (
    <group ref={groupRef}>
      {/* Main disc face */}
      <mesh>
        <circleGeometry args={[1.2, 128]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer edge ring — bright rim */}
      <mesh>
        <ringGeometry args={[1.18, 1.22, 128]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Thin disc body for depth */}
      <mesh>
        <cylinderGeometry args={[1.2, 1.2, 0.02, 128]} />
        <meshBasicMaterial
          color="#001a33"
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}
