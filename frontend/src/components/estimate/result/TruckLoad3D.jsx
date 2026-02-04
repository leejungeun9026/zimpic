import React, {
  useMemo,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Sky, ContactShadows, Environment } from "@react-three/drei";

import { SCALE, TRUCK_PRESET } from "./logic/truckPreset";
import { toNumber, itemCbm, hash01 } from "./logic/packingUtils";
import { simplePack, splitItemsByTruckLoad } from "./logic/simplePack";
import { packWithBinPacking3D_MultiTry } from "./logic/binPacking";

/* 환경/비주얼 컴포넌트 */
function DecorationTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 60, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[10, 15, 120, 8]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0, 140, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[80, 0]} />
        <meshStandardMaterial color="#66bb6a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 200, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[60, 0]} />
        <meshStandardMaterial color="#81c784" roughness={0.8} />
      </mesh>
    </group>
  );
}

function House({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 150, 0]} receiveShadow>
        <boxGeometry args={[1400, 300, 600]} />
        <meshStandardMaterial color="#fff3e0" />
      </mesh>
      <mesh position={[0, 450, 0]} receiveShadow>
        <boxGeometry args={[1400, 300, 600]} />
        <meshStandardMaterial color="#ffe0b2" />
      </mesh>
      <mesh position={[0, 700, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[0, 800, 300, 4]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>

      <mesh position={[0, 110, 301]} receiveShadow>
        <boxGeometry args={[120, 220, 10]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
      <mesh position={[40, 110, 306]}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} />
      </mesh>

      <mesh position={[-350, 150, 301]}>
        <boxGeometry args={[160, 140, 10]} />
        <meshStandardMaterial color="#b3e5fc" />
      </mesh>
      <mesh position={[350, 150, 301]}>
        <boxGeometry args={[160, 140, 10]} />
        <meshStandardMaterial color="#b3e5fc" />
      </mesh>

      <mesh position={[-350, 450, 301]}>
        <boxGeometry args={[160, 140, 10]} />
        <meshStandardMaterial color="#b3e5fc" />
      </mesh>
      <mesh position={[0, 450, 301]}>
        <boxGeometry args={[160, 140, 10]} />
        <meshStandardMaterial color="#b3e5fc" />
      </mesh>
      <mesh position={[350, 450, 301]}>
        <boxGeometry args={[160, 140, 10]} />
        <meshStandardMaterial color="#b3e5fc" />
      </mesh>

      <mesh position={[0, 10, 380]} receiveShadow>
        <boxGeometry args={[400, 20, 160]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
    </group>
  );
}

function Fence({ length = 1000 }) {
  const count = Math.floor(length / 70);
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[-length / 2 + i * 70, 50, 0]} castShadow>
          <boxGeometry args={[10, 100, 5]} />
          <meshStandardMaterial color="#eeeeee" />
        </mesh>
      ))}
      <mesh position={[0, 80, 0]}>
        <boxGeometry args={[length, 8, 5]} />
        <meshStandardMaterial color="#eeeeee" />
      </mesh>
    </group>
  );
}

function Mailbox({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 60, 0]} castShadow>
        <cylinderGeometry args={[4, 4, 120]} />
        <meshStandardMaterial color="#424242" />
      </mesh>
      <mesh position={[0, 120, 0]} castShadow>
        <boxGeometry args={[35, 25, 50]} />
        <meshStandardMaterial color="#d32f2f" />
      </mesh>
    </group>
  );
}

function ResidentialEnvironment() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[5000, 1200]} />
        <meshStandardMaterial color="#78909c" roughness={0.9} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 10, -800]} receiveShadow>
        <planeGeometry args={[5000, 400]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.8} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 10, -610]} receiveShadow>
        <boxGeometry args={[5000, 20, 15]} />
        <meshStandardMaterial color="#bdbdbd" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, -2000]} receiveShadow>
        <planeGeometry args={[5000, 2000]} />
        <meshStandardMaterial color="#a5d6a7" roughness={1} />
      </mesh>

      <group position={[0, 0, -1100]}>
        <House position={[0, 0, 0]} />
        <group position={[-1600, 0, 0]}><House position={[0, 0, 0]} /></group>
        <group position={[1600, 0, 0]}><House position={[0, 0, 0]} /></group>
      </group>

      <group position={[0, 0, -950]}>
        <Fence length={5000} />
      </group>

      <Mailbox position={[300, 0, -900]} />

      <DecorationTree position={[-500, 0, -700]} scale={1.2} />
      <DecorationTree position={[500, 0, -700]} scale={1.1} />
      <DecorationTree position={[-400, 0, -1400]} scale={1.5} />
      <DecorationTree position={[600, 0, -1350]} scale={1.3} />
    </group>
  );
}

function Wheel({ x, y, z, r = 14, w = 10 }) {
  return (
    <group position={[x * SCALE, y * SCALE, z * SCALE]} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[r * SCALE, r * SCALE, w * SCALE, 32]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.5 * SCALE, 0]}>
        <cylinderGeometry args={[r * 0.6 * SCALE, r * 0.6 * SCALE, w * 1.05 * SCALE, 16]} />
        <meshStandardMaterial color="#ddd" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.8 * SCALE, 0]}>
        <cylinderGeometry args={[r * 0.15 * SCALE, r * 0.15 * SCALE, w * 1.2 * SCALE, 8]} />
        <meshStandardMaterial color="#888" />
      </mesh>
    </group>
  );
}

function TruckShell({ truck, cabD, chassisH, bodyPaddingW, bodyPaddingD, bodyPaddingH, worldOffset }) {
  const TH = 2;
  const bedOuterW = truck.w + bodyPaddingW;
  const bedOuterD = truck.d + bodyPaddingD;
  const bedOuterH = truck.h + bodyPaddingH;
  const totalD = cabD + bedOuterD;
  const centerX = bedOuterW / 2;
  const cabW = bedOuterW * 0.92;
  const cabH = Math.max(130, truck.h * 0.65);
  const cabZ = cabD / 2;
  const chassisZ = totalD / 2;
  const bedZ = cabD + bedOuterD / 2;

  return (
    <group position={[worldOffset.x * SCALE, 0, worldOffset.z * SCALE]}>
      <mesh position={[centerX * SCALE, (chassisH / 2) * SCALE, chassisZ * SCALE]} receiveShadow>
        <boxGeometry args={[bedOuterW * SCALE, chassisH * SCALE, totalD * SCALE]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.8} />
      </mesh>

      <group position={[centerX * SCALE, (chassisH + cabH / 2) * SCALE, cabZ * SCALE]}>
        <mesh castShadow>
          <boxGeometry args={[cabW * SCALE, cabH * SCALE, cabD * SCALE]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[0, cabH * 0.15 * SCALE, -cabD * 0.51 * SCALE]}>
          <boxGeometry args={[cabW * 0.85 * SCALE, cabH * 0.4 * SCALE, 2 * SCALE]} />
          <meshStandardMaterial color="#34495e" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, -cabH * 0.25 * SCALE, -cabD * 0.51 * SCALE]}>
          <boxGeometry args={[cabW * 0.7 * SCALE, cabH * 0.2 * SCALE, 2 * SCALE]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[-cabW * 0.35 * SCALE, -cabH * 0.35 * SCALE, -cabD * 0.52 * SCALE]}>
          <boxGeometry args={[cabW * 0.12 * SCALE, cabH * 0.08 * SCALE, 4 * SCALE]} />
          <meshStandardMaterial color="#f1c40f" emissive="#f1c40f" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[cabW * 0.35 * SCALE, -cabH * 0.35 * SCALE, -cabD * 0.52 * SCALE]}>
          <boxGeometry args={[cabW * 0.12 * SCALE, cabH * 0.08 * SCALE, 4 * SCALE]} />
          <meshStandardMaterial color="#f1c40f" emissive="#f1c40f" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[-cabW * 0.52 * SCALE, cabH * 0.1 * SCALE, -cabD * 0.3 * SCALE]}>
          <boxGeometry args={[4 * SCALE, cabH * 0.2 * SCALE, 8 * SCALE]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[cabW * 0.52 * SCALE, cabH * 0.1 * SCALE, -cabD * 0.3 * SCALE]}>
          <boxGeometry args={[4 * SCALE, cabH * 0.2 * SCALE, 8 * SCALE]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>

      <mesh position={[centerX * SCALE, chassisH * 0.5 * SCALE, 5 * SCALE]} castShadow>
        <boxGeometry args={[bedOuterW * SCALE, chassisH * 1.5 * SCALE, 15 * SCALE]} />
        <meshStandardMaterial color="#95a5a6" metalness={0.5} />
      </mesh>

      <group position={[centerX * SCALE, (chassisH + bedOuterH / 2) * SCALE, bedZ * SCALE]}>
        <mesh castShadow>
          <boxGeometry args={[bedOuterW * SCALE, bedOuterH * SCALE, bedOuterD * SCALE]} />
          <meshStandardMaterial
            color="#ecf0f1"
            transparent
            opacity={0.15}
            roughness={0.1}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, (-bedOuterH / 2 + TH) * SCALE, 0]} receiveShadow>
          <boxGeometry args={[truck.w * SCALE, TH * SCALE, truck.d * SCALE]} />
          <meshStandardMaterial color="#bdc3c7" />
        </mesh>
      </group>

      {(() => {
        const wheelY = Math.max(7, chassisH - 2);
        const leftX = centerX - bedOuterW * 0.45;
        const rightX = centerX + bedOuterW * 0.45;
        const frontZ = Math.max(45, cabD * 0.5);
        const backZ = cabD + bedOuterD - Math.max(55, bedOuterD * 0.18);
        return (
          <>
            <Wheel x={leftX} y={wheelY} z={frontZ} />
            <Wheel x={rightX} y={wheelY} z={frontZ} />
            <Wheel x={leftX} y={wheelY} z={backZ} />
            <Wheel x={rightX} y={wheelY} z={backZ} />
          </>
        );
      })()}
    </group>
  );
}

/* 카메라/애니 */
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function CameraPreset({ controlsRef, target, offset = [2.4, 3.2, 8.5], onceKey }) {
  const { camera } = useThree();
  const didRef = useRef(false);

  useEffect(() => {
    didRef.current = false;
  }, [onceKey]);

  useEffect(() => {
    if (didRef.current) return;
    if (!target || target.length !== 3) return;

    const [tx, ty, tz] = target;
    const [ox, oy, oz] = offset;

    camera.position.set(tx + ox, ty + oy, tz + oz);
    camera.lookAt(tx, ty, tz);
    camera.updateProjectionMatrix();

    if (controlsRef?.current) {
      controlsRef.current.target.set(tx, ty, tz);
      controlsRef.current.update();
    }
    didRef.current = true;
  }, [camera, controlsRef, target, offset]);

  return null;
}

/**
 * ✅ FallingBox: replayToken이 바뀌면
 * - tRef/doneRef/landedRef/seedRef를 초기화
 * - 시작 위치로 즉시 되돌려서 "첫 프레임 파란 번쩍" 최소화
 */
function FallingBox({
  p,
  startY,
  delaySec,
  durationSec = 0.6,
  zOffsetCm = 0,
  yOffsetCm = 0,
  xOffsetCm = 0,
  worldOffset,
  onLand,
  freeze,
  replayToken,
}) {
  const meshRef = useRef();
  const tRef = useRef(0);
  const doneRef = useRef(false);
  const landedRef = useRef(false);
  const seedRef = useRef(null);

  // ✅ 재생 신호 들어오면 애니메이션 리셋
  useEffect(() => {
    tRef.current = 0;
    doneRef.current = false;
    landedRef.current = false;
    seedRef.current = null;

    // 즉시 시작 위치로 세팅(리셋 순간 깜빡임 최소화)
    if (meshRef.current) {
      meshRef.current.position.set(
        (worldOffset.x + xOffsetCm + p.pos.x) * SCALE,
        startY * SCALE,
        (worldOffset.z + p.pos.z + zOffsetCm) * SCALE
      );
      meshRef.current.rotation.set(0, 0, 0);
    }
  }, [replayToken, p.pos.x, p.pos.z, startY, zOffsetCm, xOffsetCm, worldOffset.x, worldOffset.z]);

  useEffect(() => {
    if (!meshRef.current) return;
    if (!seedRef.current) {
      const sx = (Math.random() - 0.5) * 85;
      const sz = (Math.random() - 0.5) * 120;
      const rx = (Math.random() - 0.5) * 1.8;
      const ry = (Math.random() - 0.5) * 1.8;
      const rz = (Math.random() - 0.5) * 1.8;
      const spin = 10 + Math.random() * 14;
      seedRef.current = { sx, sz, rx, ry, rz, spin };
    }
    const seed = seedRef.current;

    meshRef.current.position.set(
      (worldOffset.x + xOffsetCm + p.pos.x + seed.sx) * SCALE,
      startY * SCALE,
      (worldOffset.z + p.pos.z + zOffsetCm + seed.sz) * SCALE
    );
    meshRef.current.rotation.set(seed.rx, seed.ry, seed.rz);
  }, [p.pos.x, p.pos.z, startY, zOffsetCm, xOffsetCm, worldOffset.x, worldOffset.z, replayToken]);

  useFrame((_, delta) => {
    if (freeze) return;
    if (!meshRef.current) return;
    if (doneRef.current) return;

    const seed = seedRef.current;
    tRef.current += delta;
    if (tRef.current < delaySec) return;

    const localT = (tRef.current - delaySec) / durationSec;
    if (localT >= 1) {
      meshRef.current.position.set(
        (worldOffset.x + xOffsetCm + p.pos.x) * SCALE,
        (p.pos.y + yOffsetCm) * SCALE,
        (worldOffset.z + p.pos.z + zOffsetCm) * SCALE
      );
      meshRef.current.rotation.set(0, 0, 0);
      doneRef.current = true;
      if (!landedRef.current) {
        landedRef.current = true;
        onLand && onLand();
      }
      return;
    }

    const t = Math.max(0, Math.min(1, localT));
    const e = easeOutBack(t);
    const ePos = Math.max(0, Math.min(1, e));

    const x = worldOffset.x + xOffsetCm + p.pos.x + seed.sx * (1 - t);
    const z = worldOffset.z + p.pos.z + zOffsetCm + seed.sz * (1 - t);
    const yBase = startY + (p.pos.y + yOffsetCm - startY) * ePos;
    const bounce = Math.sin(t * Math.PI) * (1 - t) * 7;
    const y = yBase + bounce;

    meshRef.current.position.set(x * SCALE, y * SCALE, z * SCALE);

    const spinT = 1 - t;
    meshRef.current.rotation.set(
      seed.rx * spinT + Math.sin(t * seed.spin) * 0.2 * spinT,
      seed.ry * spinT + Math.cos(t * seed.spin) * 0.2 * spinT,
      seed.rz * spinT + Math.sin(t * seed.spin * 0.8) * 0.2 * spinT
    );
  });

  const colors = ["#e57373", "#81c784", "#64b5f6", "#ffd54f", "#ba68c8", "#4db6ac"];
  const overflowColor = "#ff5252";
  const colorIndex =
    String(p.id).split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    colors.length;

  const isBox =
    p._isBoxBundle || String(p.id).startsWith("box-") || String(p.name).includes("이사 박스");

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[p.w * SCALE, p.h * SCALE, p.d * SCALE]} />
        <meshStandardMaterial
          color={p._overflow ? overflowColor : colors[colorIndex]}
          roughness={0.6}
        />
      </mesh>

      {!isBox && (
        <Html
          position={[
            (worldOffset.x + xOffsetCm + p.pos.x) * SCALE,
            (p.pos.y + yOffsetCm + p.h / 2 + 8) * SCALE,
            (worldOffset.z + p.pos.z + zOffsetCm) * SCALE,
          ]}
          style={{
            pointerEvents: "none",
            transform: "translate(-50%, -50%)",
            whiteSpace: "nowrap",
            fontSize: "12px",
            background: "rgba(255,255,255,0.85)",
            padding: "2px 6px",
            borderRadius: "6px",
          }}
        >
          {p._overflow ? `⚠ ${p.name}` : p.name}
        </Html>
      )}
    </group>
  );
}

function TruckGroup({ tw, startY, freeze, replayToken }) {
  const tr = tw.truck;
  const preset = tw.preset;
  const CAB_D = preset.cabD;
  const CHASSIS_H = preset.chassisH;
  const pct = Math.round(toNumber(tr.loadPct, 0));

  const localWheelY = Math.max(7, CHASSIS_H - 2);
  const W_RADIUS = 14;
  const liftY = Math.max(0, W_RADIUS - localWheelY);

  const groupRef = useRef();
  const shakeY = useRef(0);
  const shakeVelocity = useRef(0);

  const handleLand = useCallback(() => {
    shakeVelocity.current = -20;
  }, []);

  useFrame((_, delta) => {
    if (freeze) return;
    if (!groupRef.current) return;

    const k = 120;
    const damp = 8;
    const mass = 1.5;

    const force = -k * shakeY.current;
    const accel = force / mass;

    shakeVelocity.current += accel * delta;
    shakeVelocity.current -= shakeVelocity.current * damp * delta;
    shakeY.current += shakeVelocity.current * delta;

    groupRef.current.position.y = (liftY + shakeY.current) * SCALE;
    groupRef.current.rotation.set(shakeY.current * 0.01, -Math.PI / 2, 0);
  });

  return (
    <group
      ref={groupRef}
      key={tr.id}
      position={[tw.worldOffset.x * SCALE, liftY * SCALE, tw.worldOffset.z * SCALE]}
      rotation={[0, -Math.PI / 2, 0]}
    >
      <TruckShell
        truck={tr}
        cabD={CAB_D}
        chassisH={CHASSIS_H}
        bodyPaddingW={preset.bodyPaddingW}
        bodyPaddingD={preset.bodyPaddingD}
        bodyPaddingH={preset.bodyPaddingH}
        worldOffset={{ x: 0, z: 0 }}
      />

      <Html
        position={[
          (0 + 55) * SCALE,
          (CHASSIS_H + tr.h + 44) * SCALE,
          (CAB_D * 0.25) * SCALE,
        ]}
        style={{ pointerEvents: "none", transform: "translate(-50%, -50%)" }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.02em",
            boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ opacity: 0.75 }}>{preset.label}</span>
          <span>적재율 {pct}%</span>
          {tw.overflowCount > 0 && <span style={{ opacity: 0.9 }}>⚠ 미적재 : {tw.overflowCount}</span>}
        </div>
      </Html>

      {tw.placements.map((p) => (
        <FallingBox
          key={`${tr.id}-${p.id}-${p._overflow ? "O" : "I"}`}
          p={p}
          startY={startY}
          delaySec={p._delayJitter ?? 0}
          durationSec={0.5}
          zOffsetCm={CAB_D + preset.bodyPaddingD / 2}
          yOffsetCm={CHASSIS_H}
          xOffsetCm={preset.bodyPaddingW / 2}
          worldOffset={{ x: 0, z: 0 }}
          onLand={handleLand}
          freeze={freeze}
          replayToken={replayToken} // ✅ 리셋 신호 전달
        />
      ))}
    </group>
  );
}

/* 메인 */
const TruckLoad3D = forwardRef(function TruckLoad3D(
  { result, freeze = false, onReady, replayToken = 0 },
  ref
) {
  const controlsRef = useRef();
  const wrapRef = useRef(null);

  useImperativeHandle(ref, () => ({
    capture: () => {
      const canvas = wrapRef.current?.querySelector("canvas");
      if (!canvas) return null;
      try {
        return canvas.toDataURL("image/png");
      } catch {
        return null;
      }
    },
  }));

  const trucks = useMemo(() => {
    const plan = result?.summary?.truck_plan ?? [];
    const expanded = [];

    plan.forEach((t, i) => {
      const type = t?.truck_type ?? "5T";
      const preset = TRUCK_PRESET[type] ?? TRUCK_PRESET["5T"];
      const count = Math.max(1, Number(t?.truck_count ?? 1));

      for (let k = 0; k < count; k++) {
        expanded.push({
          id: `${type}-${i}-${k}`,
          type,
          preset,
          w: Number(t?.inner_w_cm ?? 230),
          d: Number(t?.inner_d_cm ?? 620),
          h: Number(t?.inner_h_cm ?? 230),
          loadCbm: Number(t?.load_cbm ?? 0),
          capacityCbm: Number(t?.capacity_cbm ?? 0),
          loadPct: Number(t?.load_factor_pct ?? 0),
        });
      }
    });

    return expanded.length
      ? expanded
      : [{ id: "5T-0-0", type: "5T", preset: TRUCK_PRESET["5T"], w: 230, d: 620, h: 230, loadCbm: 0, capacityCbm: 0, loadPct: 0 }];
  }, [result]);

  const maxTruckH = useMemo(() => Math.max(...trucks.map((t) => t.h)), [trucks]);

  const items = useMemo(() => {
    const roomItems = (result?.rooms ?? []).flatMap((r) => r.items ?? []);
    const boxSpec = result?.summary?.box;
    const boxCount = Number(result?.summary?.boxes_count ?? 0);

    const boxItems = Array(boxCount).fill(0).map((_, i) => ({
      item_id: `box-${i}`,
      furniture_id: boxSpec?.furniture_id,
      name_kr: "이사 박스 5호",
      packed_w_cm: boxSpec?.packed_w_cm,
      packed_d_cm: boxSpec?.packed_d_cm,
      packed_h_cm: boxSpec?.packed_h_cm,
      allowed_rotations: boxSpec?.allowed_rotations || ["WDH", "DWH"],
      stackable: boxSpec?.stackable ?? true,
      can_stack_on_top: boxSpec?.can_stack_on_top ?? true,
    }));

    return [...roomItems, ...boxItems]
      .map((it) => ({ ...it, _vol: itemCbm(it) }))
      .sort((a, b) => (b._vol ?? 0) - (a._vol ?? 0));
  }, [result]);

  const scene = useMemo(() => {
    const { buckets, remainder } = splitItemsByTruckLoad(items, trucks);
    const GAP_TRUCK = 850;
    const out = [];

    let overflowTotal = remainder.length;

    const JITTER_SEC = 0.12;
    const withJitter = (arr, keyPrefix) =>
      arr.map((p, idx) => ({ ...p, _delayJitter: hash01(`${keyPrefix}-${p.id}-${idx}`) * JITTER_SEC }));

    for (let i = 0; i < trucks.length; i++) {
      const tr = trucks[i];
      const preset = tr.preset;

      const worldOffset = { x: (i - (trucks.length - 1) / 2) * GAP_TRUCK, z: 0 };

      const res = packWithBinPacking3D_MultiTry(buckets[i], tr, 9);
      const safePacked = res.packedPlacements;

      const overflowOriginX = tr.w + preset.bodyPaddingW + 60;
      const overflowOriginZ = preset.cabD + 20;

      const overflowPlacements = simplePack(res.unfittedItems ?? [], tr, {
        overflow: true,
        respectBounds: false,
        gap: 8,
        originX: overflowOriginX,
        originZ: overflowOriginZ,
        originY: 0,
      });

      overflowTotal += (res.unfittedItems?.length ?? 0);

      out.push({
        truck: tr,
        preset,
        worldOffset,
        placements: [
          ...withJitter(safePacked, `TRUCK-${tr.id}-IN`),
          ...withJitter(overflowPlacements, `TRUCK-${tr.id}-OF`),
        ],
        overflowCount: res.unfittedItems?.length ?? 0,
      });
    }

    let globalRemainderPlacements = [];
    if (remainder.length && out[0]) {
      const tr0 = out[0].truck;
      const preset0 = out[0].preset;

      const overflowOriginX = tr0.w + preset0.bodyPaddingW + 60;
      const overflowOriginZ = preset0.cabD + 360;

      globalRemainderPlacements = simplePack(remainder, tr0, {
        overflow: true,
        respectBounds: false,
        gap: 10,
        originX: overflowOriginX,
        originZ: overflowOriginZ,
        originY: 0,
      })
        .map((p) => ({ ...p, name: `치수불가: ${p.name}` }))
        .map((p, idx) => ({ ...p, _delayJitter: hash01(`GLOBAL-${p.id}-${idx}`) * JITTER_SEC }));
    }

    return { trucks: out, overflowTotal, globalRemainderPlacements };
  }, [items, trucks]);

  const cameraTarget = useMemo(() => [-3, 1.2, 1.4], []);
  const startY = useMemo(() => maxTruckH + 10 + 220, [maxTruckH]);

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        maxHeight: 320,
        minHeight: 220,
        borderRadius: 12,
        overflow: "hidden",
        background: "#E9EEF5", // 하늘색 번쩍 제거(중립)
        position: "relative",
      }}
    >
      {scene.overflowTotal > 0 && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 2,
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 10,
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 900,
            color: "#d32f2f",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          ⚠️ 트럭에 못 실은 짐(빨간색): {scene.overflowTotal}개
        </div>
      )}

      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, alpha: true }} // 투명
        camera={{ fov: 40, near: 0.5, far: 4000, position: [30, 20, 30] }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%", display: "block", background: "transparent" }}
        onCreated={({ gl }) => {
          // 캔버스 클리어를 투명으로(래퍼 배경이 자연스럽게 보이게)
          gl.setClearColor(0x000000, 0);
          onReady?.();
        }}
      >
        <CameraPreset
          controlsRef={controlsRef}
          target={cameraTarget}
          offset={[2.4, 3.2, 8.5]}
          onceKey={`${result?.estimate_id ?? "x"}-${trucks.length}-v3-noOverlap`}
        />

        <Sky sunPosition={[100, 50, 50]} turbidity={0.2} rayleigh={0.15} />
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[50, 150, 50]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <Environment preset="park" />

        <group scale={[SCALE, SCALE, SCALE]}>
          <ResidentialEnvironment />
        </group>

        {scene.trucks.map((tw) => (
          <TruckGroup
            key={tw.truck.id}
            tw={tw}
            startY={startY}
            freeze={freeze}
            replayToken={replayToken}
          />
        ))}

        {scene.globalRemainderPlacements.length > 0 && scene.trucks[0] && (() => {
          const preset0 = scene.trucks[0].preset;
          const liftY = Math.max(0, 14 - Math.max(7, preset0.chassisH - 2));
          return (
            <group
              position={[scene.trucks[0].worldOffset.x * SCALE, liftY * SCALE, scene.trucks[0].worldOffset.z * SCALE]}
              rotation={[0, -Math.PI / 2, 0]}
            >
              {scene.globalRemainderPlacements.map((p, idx) => (
                <FallingBox
                  key={`GLOBAL-${p.id}-${idx}`}
                  p={p}
                  startY={startY}
                  delaySec={0.2 + (p._delayJitter ?? 0)}
                  durationSec={0.5}
                  zOffsetCm={preset0.cabD}
                  yOffsetCm={preset0.chassisH}
                  xOffsetCm={preset0.bodyPaddingW / 2}
                  worldOffset={{ x: 0, z: 0 }}
                  freeze={freeze}
                  replayToken={replayToken}
                />
              ))}
            </group>
          );
        })()}

        <ContactShadows position={[0, 0.1, 0]} opacity={0.6} scale={100} blur={2} far={4} color="#000" />
        <OrbitControls ref={controlsRef} makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.05} />
      </Canvas>
    </div>
  );
});

export default TruckLoad3D;
