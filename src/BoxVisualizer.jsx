import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";

function Scene({ items }) {
  const spacing = 0.05;
  const stackedBoxes = [];
  let currentX = 0;
  let currentZ = 0;
  let stackY = 0;
  let previousWasFragile = false;

  items.forEach((item, index) => {
    const length = Number(item.length) / 100;
    const width = Number(item.width) / 100;
    const height = Number(item.height) / 100;

    let color = item.fragile
      ? "red"
      : item.heavy
      ? "brown"
      : "skyblue";

    // Determine stacking position
    if (index === 0) {
      stackY = height / 2;
    } else {
      if (previousWasFragile) {
        // Move to next X if last was fragile
        currentX += length + spacing;
        stackY = height / 2;
      } else {
        // Stack on top
        stackY += height + spacing;
      }
    }

    stackedBoxes.push(
      <mesh key={index} position={[currentX, stackY, currentZ]}>
        <boxGeometry args={[length, height, width]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );

    previousWasFragile = item.fragile;
  });

  return stackedBoxes;
}

export default function BoxVisualizer({ items, canvasRef }) {
  return (
    <div ref={canvasRef} className="h-[500px] mt-6 border rounded shadow relative bg-white">
      <Canvas>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <PerspectiveCamera makeDefault position={[10, 10, 10]} />
        <OrbitControls />
        <Scene items={items} />
      </Canvas>

      {/* LEGEND */}
      <div className="mt-4 text-sm text-center space-y-1 absolute bottom-2 left-2 bg-white bg-opacity-70 p-2 rounded">
        <p><span className="inline-block w-4 h-4 bg-skyblue mr-2 border"></span>Normal</p>
        <p><span className="inline-block w-4 h-4 bg-red-500 mr-2 border"></span>Fragile</p>
        <p><span className="inline-block w-4 h-4 bg-yellow-800 mr-2 border"></span>Heavy</p>
      </div>
    </div>
  );
}
