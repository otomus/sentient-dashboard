import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense } from "react";
import { BrainCore } from "./BrainCore";
import { NerveNodes } from "./NerveNodes";
import { AmbientParticles } from "./AmbientParticles";
import { SceneCamera } from "./SceneCamera";

export function BrainScene() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "#0d0d14" }}
      >
        <Suspense fallback={null}>
          <SceneCamera />
          <ambientLight intensity={0.1} />
          <pointLight position={[10, 10, 10]} intensity={0.3} color="#7c5bf5" />
          <pointLight position={[-10, -10, -5]} intensity={0.2} color="#a78bfa" />

          <BrainCore />
          <NerveNodes />
          <AmbientParticles count={200} />

          <EffectComposer>
            <Bloom
              intensity={0.6}
              luminanceThreshold={0.4}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
