/**
 * Reality Branch Tree 3D - Interactive Consciousness Map
 *
 * 3D visualization of reality branches as a growing tree structure.
 * Each node represents a branch point, edges show transitions,
 * colors indicate RI levels, and the tree grows organically over time.
 */

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import { supabase } from '../lib/supabase';
import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface BranchNode {
  id: string;
  position: THREE.Vector3;
  resonanceIndex: number;
  timestamp: string;
  children: BranchNode[];
  parent: BranchNode | null;
}

interface RealityBranchTree3DProps {
  userId: string;
  maxBranches?: number;
  autoRotate?: boolean;
  className?: string;
}

function BranchNodeSphere({ node, onClick }: { node: BranchNode; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.5, 1.5, 1.5), 0.1);
    } else if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  const color = getRIColor(node.resonanceIndex);

  return (
    <group position={node.position}>
      <Sphere
        ref={meshRef}
        args={[0.3, 32, 32]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      {hovered && (
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`RI: ${node.resonanceIndex.toFixed(2)}`}
        </Text>
      )}
    </group>
  );
}

function BranchConnection({ start, end }: { start: THREE.Vector3; end: THREE.Vector3 }) {
  const points = [start, end];

  return (
    <Line
      points={points}
      color="#4a5568"
      lineWidth={2}
      opacity={0.6}
      transparent
    />
  );
}

function TreeScene({ nodes, selectedNode, onNodeClick }: {
  nodes: BranchNode[];
  selectedNode: BranchNode | null;
  onNodeClick: (node: BranchNode) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {nodes.map(node => (
        <BranchNodeSphere
          key={node.id}
          node={node}
          onClick={() => onNodeClick(node)}
        />
      ))}

      {nodes.map(node => {
        if (node.parent) {
          return (
            <BranchConnection
              key={`${node.parent.id}-${node.id}`}
              start={node.parent.position}
              end={node.position}
            />
          );
        }
        return null;
      })}
    </group>
  );
}

function getRIColor(ri: number): string {
  if (ri >= 0.75) return '#10b981'; // green
  if (ri >= 0.5) return '#3b82f6';  // blue
  if (ri >= 0.3) return '#f59e0b';  // yellow
  return '#ef4444'; // red
}

export function RealityBranchTree3D({
  userId,
  maxBranches = 50,
  autoRotate = true,
  className = ''
}: RealityBranchTree3DProps) {
  const [nodes, setNodes] = useState<BranchNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<BranchNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraZoom, setCameraZoom] = useState(10);

  useEffect(() => {
    fetchBranchData();
  }, [userId, maxBranches]);

  async function fetchBranchData() {
    try {
      setLoading(true);
      setError(null);

      const { data: branches, error: branchError } = await supabase
        .from('reality_branches')
        .select('id, created_at, resonance_index')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(maxBranches);

      if (branchError) throw branchError;
      if (!branches || branches.length === 0) {
        setNodes([]);
        return;
      }

      // Build tree structure with organic positioning
      const treeNodes: BranchNode[] = [];
      const angleStep = (Math.PI * 2) / Math.max(branches.length, 8);
      const heightStep = 2;

      branches.forEach((branch, index) => {
        const angle = angleStep * index;
        const radius = 3 + Math.sin(index * 0.5) * 2;
        const height = index * heightStep / Math.max(branches.length / 10, 1);

        const position = new THREE.Vector3(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        );

        const node: BranchNode = {
          id: branch.id,
          position,
          resonanceIndex: branch.resonance_index,
          timestamp: branch.created_at,
          children: [],
          parent: index > 0 ? treeNodes[index - 1] : null
        };

        if (node.parent) {
          node.parent.children.push(node);
        }

        treeNodes.push(node);
      });

      setNodes(treeNodes);
    } catch (err) {
      console.error('Failed to fetch branch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tree');
    } finally {
      setLoading(false);
    }
  }

  function handleNodeClick(node: BranchNode) {
    setSelectedNode(node);
  }

  function resetCamera() {
    setCameraZoom(10);
  }

  if (loading) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Loading reality tree...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/50 rounded-lg p-6 ${className}`}>
        <p className="text-red-400">Error loading tree: {error}</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-2">Reality Branch Tree</h3>
        <p className="text-slate-400">
          No reality branches yet. Create branches through assessments to grow your consciousness tree.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div>
          <h3 className="text-lg font-semibold text-white">Reality Branch Tree</h3>
          <p className="text-sm text-slate-400">{nodes.length} branches visualized</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCameraZoom(prev => Math.max(5, prev - 2))}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setCameraZoom(prev => Math.min(20, prev + 2))}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={resetCamera}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={fetchBranchData}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="h-[600px] bg-slate-900">
        <Canvas
          camera={{ position: [cameraZoom, cameraZoom, cameraZoom], fov: 50 }}
        >
          <TreeScene
            nodes={nodes}
            selectedNode={selectedNode}
            onNodeClick={handleNodeClick}
          />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="text-sm">
            <div className="text-slate-400 mb-2">Selected Branch</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400">RI:</span>
                <span className={`ml-2 font-semibold ${
                  selectedNode.resonanceIndex >= 0.75 ? 'text-green-400' :
                  selectedNode.resonanceIndex >= 0.5 ? 'text-blue-400' :
                  selectedNode.resonanceIndex >= 0.3 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {selectedNode.resonanceIndex.toFixed(3)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Created:</span>
                <span className="ml-2 text-white">
                  {new Date(selectedNode.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/30">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-slate-400">High RI (≥0.75)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-slate-400">Moderate (≥0.5)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-slate-400">Developing (≥0.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-slate-400">Growing (&lt;0.3)</span>
            </div>
          </div>
          <div className="text-slate-500">
            Click nodes to inspect • Drag to rotate • Scroll to zoom
          </div>
        </div>
      </div>
    </div>
  );
}
