import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useNeuralStore } from "../../stores/neural";
import { loadNerveDetails } from "../../utils/nerve";

interface NerveNodeProps {
  name: string;
  position: [number, number, number];
  score: number;
  status: string;
  isActive: boolean;
}

// Animated beam from brain core to active nerve
function SynapseBeam({ target }: { target: THREE.Vector3 }) {
  const lineRef = useRef<THREE.Line>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!lineRef.current || !pulseRef.current) return;
    const t = clock.getElapsedTime();

    const posAttr = lineRef.current.geometry.attributes.position as THREE.BufferAttribute;
    posAttr.setXYZ(0, 0, 0, 0);
    posAttr.setXYZ(1, target.x, target.y, target.z);
    posAttr.needsUpdate = true;

    const progress = Math.sin(t * 3) * 0.5 + 0.5;
    pulseRef.current.position.lerpVectors(origin, target, progress);

    const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.6 + Math.sin(t * 6) * 0.3;
  });

  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#00ff88",
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  return (
    <>
      <primitive ref={lineRef} object={new THREE.Line(geometry, lineMaterial)} />
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

function NerveNode({ name, position, score, status, isActive }: NerveNodeProps) {
  const meshRef = useRef<THREE.Group>(null);
  const basePos = useMemo(() => new THREE.Vector3(...position), [position]);
  const [hovered, setHovered] = useState(false);

  const color = useMemo(() => {
    if (status === "pass") return new THREE.Color("#00d4ff");
    if (status === "fail") return new THREE.Color("#f55b5b");
    if (status === "testing") return new THREE.Color("#00ff88");
    return new THREE.Color("#4a4a6a");
  }, [status]);

  const normalizedScore = score > 1 ? score / 100 : score;
  const size = 0.03 + normalizedScore * 0.02;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.position.x = basePos.x + Math.sin(t * 0.3 + basePos.y) * 0.15;
    meshRef.current.position.y = basePos.y + Math.cos(t * 0.4 + basePos.x) * 0.1;
    meshRef.current.position.z = basePos.z + Math.sin(t * 0.2 + basePos.z) * 0.1;
  });

  const handleClick = () => loadNerveDetails(name);

  return (
    <group ref={meshRef} position={position}>
      {/* Clickable hit area */}
      <mesh
        onClick={handleClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Visible dot */}
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.5 : hovered ? 0.4 : 0.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Active ring */}
      {isActive && (
        <mesh>
          <ringGeometry args={[size * 2, size * 3, 32]} />
          <meshBasicMaterial
            color="#00ff88"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Label — always visible, brighter on hover */}
      <Html center style={{ pointerEvents: "none" }}>
        <div
          style={{
            color: isActive ? "#00ff88" : hovered ? "#ffffff" : "rgba(224,224,240,0.55)",
            fontSize: 11,
            fontFamily: "Share Tech Mono, JetBrains Mono, monospace",
            fontWeight: isActive ? 700 : 600,
            whiteSpace: "nowrap",
            textShadow: "0 0 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.7)",
            textAlign: "center",
            transform: "translateY(-16px)",
            cursor: "pointer",
          }}
        >
          {name}
        </div>
      </Html>
    </group>
  );
}

function distributeOnSphere(count: number, radius: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < count; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    points.push([
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
    ]);
  }
  return points;
}

/** 3D nerve node cloud distributed on a sphere around the brain core. */
export function NerveNodes() {
  const nerves = useNeuralStore((s) => s.nerves);
  const activeNerve = useNeuralStore((s) => s.activeNerve);

  const positions = useMemo(() => {
    return distributeOnSphere(Math.max(nerves.length, 1), 2.5);
  }, [nerves.length]);

  const activeIndex = nerves.findIndex((n) => n.name === activeNerve);
  const activePos = activeIndex >= 0 ? positions[activeIndex] : null;

  const activeTarget = useMemo(
    () => (activePos ? new THREE.Vector3(...activePos) : null),
    [activePos],
  );

  return (
    <group>
      {activeTarget && <SynapseBeam target={activeTarget} />}

      {nerves.map((nerve, i) => (
        <NerveNode
          key={nerve.name}
          name={nerve.name}
          position={positions[i] || [0, 0, 2.5]}
          score={nerve.score}
          status={nerve.status}
          isActive={activeNerve === nerve.name}
        />
      ))}
    </group>
  );
}
