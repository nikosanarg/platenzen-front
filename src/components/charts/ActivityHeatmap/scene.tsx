'use client';

import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';

const CELL_SIZE = 0.9;
const CELL_GAP = 0.18;
const GRID_STEP = CELL_SIZE + CELL_GAP;
const TILE_HEIGHT = 0.05;
const BASE_TILE_COLOR = '#4f5968';
const ACTIVE_TILE_COLOR = '#434c5a';
const FLOOR_COLOR = '#151d29';

// Colores por mes: consecutivos son complementarios/opuestos para máximo contraste
const MONTH_CONFIG: Record<number, { label: string; color: string }> = {
  1:  { label: 'ENE', color: '#29B6F6' },
  2:  { label: 'FEB', color: '#EF5350' },
  3:  { label: 'MAR', color: '#66BB6A' },
  4:  { label: 'ABR', color: '#CE93D8' },
  5:  { label: 'MAY', color: '#FFA726' },
  6:  { label: 'JUN', color: '#4DD0E1' },
  7:  { label: 'JUL', color: '#F06292' },
  8:  { label: 'AGO', color: '#DCE775' },
  9:  { label: 'SEP', color: '#9575CD' },
  10: { label: 'OCT', color: '#FF8A65' },
  11: { label: 'NOV', color: '#80CBC4' },
  12: { label: 'DIC', color: '#FFD54F' },
};

type Heatmap3DConfig = {
  cameraXFactor: number;
  cameraYMin: number;
  cameraYFromBarOffset: number;
  cameraZMin: number;
  cameraZFromGridWidthFactor: number;
  cameraFov: number;
  cameraNear: number;
  cameraFar: number;
  dprMin: number;
  dprMax: number;
  floorPadding: number;
  barBaseScale: number;
  ambientLightIntensity: number;
  keyLightIntensity: number;
  fillLightIntensity: number;
};

// Ajustes visuales "a ojo": este bloque controla encuadre y look general.
const HEATMAP_3D_CONFIG: Heatmap3DConfig = {
  cameraXFactor: 1.6,
  cameraYMin: 2.6,
  cameraYFromBarOffset: 25,
  cameraZMin: 30,
  cameraZFromGridWidthFactor: 0.2,
  cameraFov: 14,
  cameraNear: 0.1,
  cameraFar: 150,
  dprMin: 1,
  dprMax: 2,
  floorPadding: 0,
  barBaseScale: 0.6,
  ambientLightIntensity: 0.75,
  keyLightIntensity: 0.75,
  fillLightIntensity: 1,
};

export interface Heatmap3DCell {
  date: string;
  height: number;
  x: number;
  z: number;
}

export interface Heatmap3DSceneProps {
  cells: Heatmap3DCell[];
  gridWidth: number;
  gridDepth: number;
  maxBarHeight: number;
  monthLabels?: Array<{ monthNum: number; weekIdx: number }>;
}


const ActivityHeatmapScene3D: React.FC<Heatmap3DSceneProps> = ({
  cells,
  gridWidth,
  gridDepth,
  maxBarHeight,
  monthLabels = [],
}) => {
    // Posición de labels manuscritos
    const labelYOffset = 2;
    const labelFontSize = 1.1;
    const labelRotation = Math.PI / 3; // 60° CCW
  const cfg = HEATMAP_3D_CONFIG;
  const cameraY = Math.max(cfg.cameraYMin, maxBarHeight + cfg.cameraYFromBarOffset);
  const cameraZ = Math.max(cfg.cameraZMin, gridWidth * cfg.cameraZFromGridWidthFactor);
  const cameraX = gridWidth * cfg.cameraXFactor;

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    km: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasKey, setCanvasKey] = useState(0);
  function formatDate(date: string) {
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y.slice(2)}`;
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 240, minHeight: 180, minWidth: 320, position: 'relative' }}
    >
      <Canvas
        key={canvasKey}
        dpr={[cfg.dprMin, cfg.dprMax]}
        camera={{
          position: [cameraX, cameraY, cameraZ],
          fov: cfg.cameraFov,
          near: cfg.cameraNear,
          far: cfg.cameraFar,
        }}
        frameloop="demand"
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', () => {
            setCanvasKey(k => k + 1);
          }, { once: true });
        }}
        onPointerMissed={() => setTooltip(null)}
      >
          <ambientLight intensity={cfg.ambientLightIntensity} />
          <directionalLight position={[24, 36, 14]} intensity={cfg.keyLightIntensity} />
          <directionalLight position={[-18, 14, -14]} intensity={cfg.fillLightIntensity} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.1}
            minAzimuthAngle={-Math.PI / 2}
            maxAzimuthAngle={Math.PI / 2}
          />

          <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
            <planeGeometry args={[gridWidth + cfg.floorPadding, gridDepth + cfg.floorPadding]} />
            <meshStandardMaterial color={FLOOR_COLOR} roughness={1} metalness={0} />
          </mesh>

          {cells.map((cell) => (
            <group key={cell.date} position={[cell.x, 0, cell.z]}>
              <mesh position={[0, TILE_HEIGHT / 2, 0]}>
                <boxGeometry args={[CELL_SIZE, TILE_HEIGHT, CELL_SIZE]} />
                <meshStandardMaterial
                  color={cell.height > 0 ? ACTIVE_TILE_COLOR : BASE_TILE_COLOR}
                  roughness={1}
                  metalness={0}
                />
              </mesh>

              {cell.height > 0 && (
                <mesh
                  position={[0, TILE_HEIGHT + cell.height / 2, 0]}
                  onPointerOver={(e) => {
                    // Calcula posición relativa al contenedor
                    const rect = containerRef.current?.getBoundingClientRect();
                    setTooltip({
                      x: e.clientX - (rect?.left ?? 0),
                      y: e.clientY - (rect?.top ?? 0),
                      date: cell.date,
                      km: +(cell.height / 0.24).toFixed(2),
                    });
                    e.stopPropagation();
                  }}
                  onPointerOut={() => setTooltip(null)}
                >
                  <boxGeometry
                    args={[CELL_SIZE * cfg.barBaseScale, cell.height, CELL_SIZE * cfg.barBaseScale]}
                  />
                  <meshStandardMaterial
                    color={MONTH_CONFIG[parseInt(cell.date.split('-')[1], 10)]?.color ?? '#fc4c02'}
                    roughness={0.95}
                    metalness={0}
                  />
                </mesh>
              )}
            </group>
          ))}

          {/* Labels de meses */}
          {monthLabels.map((m) => {
            const monthCfg = MONTH_CONFIG[m.monthNum];
            if (!monthCfg) return null;
            const labelX = m.weekIdx * GRID_STEP - (gridWidth - GRID_STEP) / 2;
            return (
              <Text
                key={m.monthNum}
                position={[labelX, labelYOffset, -gridDepth / 2]}
                fontSize={labelFontSize}
                color={monthCfg.color}
                rotation={[0, 0, labelRotation]}
                anchorX="left"
                anchorY="bottom"
                maxWidth={4.5}
                outlineColor="#000"
                outlineWidth={0.04}
              >
                {monthCfg.label}
              </Text>
            );
          })}
        </Canvas>
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 12,
            top: tooltip.y - 18,
            background: 'rgba(20,22,28,0.98)',
            color: '#fff',
            fontSize: '0.82rem',
            borderRadius: 6,
            padding: '6px 12px',
            pointerEvents: 'none',
            boxShadow: '0 2px 12px 0 #0008',
            zIndex: 10,
            whiteSpace: 'nowrap',
            border: '1px solid #222',
          }}
        >
          <div><b>{formatDate(tooltip.date)}</b></div>
          <div>{tooltip.km} km</div>
        </div>
      )}
    </div>
  );
};

export default ActivityHeatmapScene3D;
