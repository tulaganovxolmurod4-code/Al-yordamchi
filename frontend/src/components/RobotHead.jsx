import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { STATES, EMOTIONS, STATE_COLORS, EMOTION_COLORS } from "../state/jarvisState";

function EyeGlow({ position, color, blink, focus }) {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    const targetScaleY = blink ? 0.05 : 1;
    ref.current.scale.y += (targetScaleY - ref.current.scale.y) * 0.4;
    if (focus) {
      ref.current.position.z += (0.06 - (ref.current.position.z - position[2])) * 0.1;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.075, 24, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2.2}
        toneMapped={false}
      />
    </mesh>
  );
}

function Mouth({ mouthVolume, state }) {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    const active = state === STATES.SPEAKING ? 0.05 + mouthVolume * 0.35 : 0.04;
    ref.current.scale.y += (active - ref.current.scale.y) * 0.5;
  });
  return (
    <mesh ref={ref} position={[0, -0.42, 0.78]}>
      <boxGeometry args={[0.34, 0.08, 0.05]} />
      <meshStandardMaterial color="#0a1622" emissive="#3fc8ff" emissiveIntensity={0.6} toneMapped={false} />
    </mesh>
  );
}

function HeadMesh({ state, emotion, mouthVolume }) {
  const group = useRef();
  const ring = useRef();
  const blinkState = useRef({ next: 2 + Math.random() * 3, timer: 0, blinking: false });

  const color = state === STATES.ERROR ? STATE_COLORS.error : EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;

  useFrame((_, delta) => {
    if (!group.current) return;

    const t = performance.now() / 1000;
    const idleSway = state === STATES.IDLE ? Math.sin(t * 0.6) * 0.05 : 0;
    const thinkingTilt = state === STATES.THINKING ? Math.sin(t * 1.6) * 0.08 : 0;
    group.current.rotation.y += (idleSway + thinkingTilt - group.current.rotation.y) * 0.05;
    group.current.rotation.x += ((state === STATES.LISTENING ? 0.05 : 0) - group.current.rotation.x) * 0.05;
    group.current.position.y = Math.sin(t * 1.2) * 0.02;

    if (ring.current) {
      ring.current.rotation.z += delta * (state === STATES.THINKING ? 2.4 : 0.3);
      ring.current.visible = state === STATES.THINKING;
    }

    const b = blinkState.current;
    b.timer += delta;
    if (!b.blinking && b.timer > b.next) {
      b.blinking = true;
      b.timer = 0;
    }
    if (b.blinking && b.timer > 0.15) {
      b.blinking = false;
      b.timer = 0;
      b.next = 2 + Math.random() * 3;
    }
  });

  const blink = blinkState.current.blinking;
  const focus = state === STATES.LISTENING;

  return (
    <group ref={group}>
      <mesh>
        <capsuleGeometry args={[0.62, 0.55, 8, 24]} />
        <meshStandardMaterial color="#12161c" metalness={0.85} roughness={0.28} />
      </mesh>

      <mesh position={[0, 0, 0.55]}>
        <cylinderGeometry args={[0.5, 0.45, 0.15, 32, 1, true, Math.PI * 0.15, Math.PI * 0.7]} />
        <meshStandardMaterial color="#1c232c" metalness={0.7} roughness={0.35} side={2} />
      </mesh>

      <EyeGlow position={[-0.22, 0.08, 0.78]} color={color} blink={blink} focus={focus} />
      <EyeGlow position={[0.22, 0.08, 0.78]} color={color} blink={blink} focus={focus} />
      <Mouth mouthVolume={mouthVolume} state={state} />

      <mesh ref={ring} position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.012, 8, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} toneMapped={false} />
      </mesh>

      <mesh position={[0, -0.68, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.18, 16]} />
        <meshStandardMaterial color="#0d1116" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Lighting({ color }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[2, 2, 3]} intensity={1.1} color={color} />
      <pointLight position={[-2, -1, 2]} intensity={0.4} color="#0a3d5c" />
      <pointLight position={[0, -1.5, 1]} intensity={0.3} color={color} />
    </>
  );
}

export default function RobotHead({ state = STATES.IDLE, emotion = EMOTIONS.NEUTRAL, mouthVolume = 0 }) {
  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 3.1], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <Lighting color={color} />
      <HeadMesh state={state} emotion={emotion} mouthVolume={mouthVolume} />
    </Canvas>
  );
}
