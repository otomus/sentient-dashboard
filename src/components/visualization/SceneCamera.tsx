import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

export function SceneCamera() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Slow auto-orbit
    const orbitRadius = 8;
    const orbitSpeed = 0.05;
    const baseX = Math.sin(t * orbitSpeed) * orbitRadius;
    const baseZ = Math.cos(t * orbitSpeed) * orbitRadius;
    const baseY = Math.sin(t * orbitSpeed * 0.3) * 1.5;

    // Mouse parallax offset
    const parallaxStrength = 1.5;
    const targetX = baseX + mouse.current.x * parallaxStrength;
    const targetY = baseY - mouse.current.y * parallaxStrength;
    const targetZ = baseZ;

    // Smooth follow
    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.y += (targetY - camera.position.y) * 0.02;
    camera.position.z += (targetZ - camera.position.z) * 0.02;

    camera.lookAt(new THREE.Vector3(0, 0, 0));
  });

  return null;
}
