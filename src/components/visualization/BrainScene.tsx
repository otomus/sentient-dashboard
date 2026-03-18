import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense } from "react";
import { BrainCore } from "./BrainCore";
import { NerveNodes } from "./NerveNodes";
import { AmbientParticles } from "./AmbientParticles";
import { SceneCamera } from "./SceneCamera";

/** Three.js canvas wrapping the 3D brain core, nerve nodes, particles, and post-processing. */
export function BrainScene() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "#050510" }}
      >
        <Suspense fallback={null}>
          <SceneCamera />
          <ambientLight intensity={0.1} />
          <pointLight position={[10, 10, 10]} intensity={0.3} color="#00d4ff" />
          <pointLight position={[-10, -10, -5]} intensity={0.2} color="#00ff88" />

          <BrainCore />
          <NerveNodes />
          <AmbientParticles count={200} />

          <EffectComposer>
            <Bloom intensity={0.6} luminanceThreshold={0.4} luminanceSmoothing={0.9} mipmapBlur />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
