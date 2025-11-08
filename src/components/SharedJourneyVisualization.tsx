/**
 * Shared Journey Visualization - Collective Growth in 3D
 *
 * Visualizes multiple cohort members' journeys overlaid in 3D space,
 * showing collective patterns, synchronicity, and mutual support.
 *
 * Features:
 * - Multi-trajectory 3D rendering
 * - Color-coded by RI trend
 * - Anonymous display names
 * - Interactive hover for details
 * - Trend indicators
 */

import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { sharedJourneyService } from '../services/roe/SharedJourneyService';
import { TrendingUp, TrendingDown, Minus, Users, Eye, EyeOff } from 'lucide-react';

interface TrajectoryPoint {
  timestamp: string;
  ri: number;
  emotionState?: string;
}

interface Journey {
  userId: string;
  displayName: string;
  trajectoryPoints: TrajectoryPoint[];
  riTrend: 'improving' | 'stable' | 'declining';
  shareLevel: string;
  anonymized: boolean;
}

interface SharedJourneyVisualizationProps {
  cohortId: string;
  userId: string;
  className?: string;
}

function JourneyPath({ journey, index }: { journey: Journey; index: number }) {
  if (journey.trajectoryPoints.length === 0) return null;

  // Convert trajectory to 3D points
  const points = journey.trajectoryPoints.map((point, idx) => {
    const x = idx - journey.trajectoryPoints.length / 2;
    const y = point.ri * 5;
    const z = index * 2;
    return new THREE.Vector3(x, y, z);
  });

  // Color based on trend
  const getTrendColor = () => {
    switch (journey.riTrend) {
      case 'improving':
        return '#10b981'; // green
      case 'declining':
        return '#ef4444'; // red
      default:
        return '#6366f1'; // indigo
    }
  };

  return (
    <group>
      <Line
        points={points}
        color={getTrendColor()}
        lineWidth={2}
        opacity={0.8}
      />
      {/* Label at end of trajectory */}
      <Text
        position={[points[points.length - 1].x, points[points.length - 1].y + 0.5, points[points.length - 1].z]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {journey.displayName}
      </Text>
      {/* Spheres at data points */}
      {points.map((point, idx) => (
        <mesh key={idx} position={point}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={getTrendColor()} />
        </mesh>
      ))}
    </group>
  );
}

function GridPlane() {
  return (
    <group>
      <gridHelper args={[20, 20, '#334155', '#1e293b']} />
      {/* RI scale labels */}
      {[0, 0.25, 0.5, 0.75, 1.0].map(ri => (
        <Text
          key={ri}
          position={[-10, ri * 5, 0]}
          fontSize={0.3}
          color="#94a3b8"
          anchorX="right"
        >
          {(ri * 100).toFixed(0)}%
        </Text>
      ))}
    </group>
  );
}

export function SharedJourneyVisualization({
  cohortId,
  userId,
  className = ''
}: SharedJourneyVisualizationProps) {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [sharingStatus, setSharingStatus] = useState<any>(null);
  const [cohortStats, setCohortStats] = useState<any>(null);

  useEffect(() => {
    loadJourneys();
    loadSharingStatus();
    loadCohortStats();
  }, [cohortId]);

  async function loadJourneys() {
    try {
      setLoading(true);
      const cohortJourneys = await sharedJourneyService.getCohortJourneys(cohortId);
      setJourneys(cohortJourneys);
    } catch (error) {
      console.error('Failed to load journeys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSharingStatus() {
    const status = await sharedJourneyService.getSharingStatus(userId, cohortId);
    setSharingStatus(status);
  }

  async function loadCohortStats() {
    const stats = await sharedJourneyService.getCohortStats(cohortId);
    setCohortStats(stats);
  }

  async function toggleSharing() {
    if (sharingStatus) {
      await sharedJourneyService.disableSharing(userId, cohortId);
      setSharingStatus(null);
    } else {
      await sharedJourneyService.enableSharing(userId, cohortId, 'trajectory_only', true);
      await loadSharingStatus();
    }
    await loadJourneys();
    await loadCohortStats();
  }

  if (loading) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Shared Journeys</h3>
          </div>
          <button
            onClick={toggleSharing}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              sharingStatus
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {sharingStatus ? (
              <>
                <EyeOff className="w-4 h-4" />
                Stop Sharing
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Share My Journey
              </>
            )}
          </button>
        </div>

        {/* Cohort Stats */}
        {cohortStats && (
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-700/50 rounded p-2">
              <div className="text-slate-400 mb-1">Members Sharing</div>
              <div className="text-white font-semibold text-lg">{cohortStats.memberCount}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-2">
              <div className="text-slate-400 mb-1">Avg RI</div>
              <div className="text-white font-semibold text-lg">
                {(cohortStats.avgRI * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-slate-700/50 rounded p-2">
              <div className="text-slate-400 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                Improving
              </div>
              <div className="text-white font-semibold text-lg">{cohortStats.trends.improving}</div>
            </div>
            <div className="bg-slate-700/50 rounded p-2">
              <div className="text-slate-400 mb-1 flex items-center gap-1">
                <Minus className="w-3 h-3 text-blue-400" />
                Stable
              </div>
              <div className="text-white font-semibold text-lg">{cohortStats.trends.stable}</div>
            </div>
          </div>
        )}
      </div>

      {/* 3D Visualization */}
      {journeys.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          <p className="mb-2">No shared journeys yet</p>
          <p className="text-sm">Be the first to share your journey with the cohort</p>
        </div>
      ) : (
        <div className="h-[600px] bg-slate-900/50">
          <Canvas camera={{ position: [0, 5, 15], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <GridPlane />
            {journeys.map((journey, index) => (
              <JourneyPath key={journey.userId} journey={journey} index={index} />
            ))}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
            />
          </Canvas>
        </div>
      )}

      {/* Legend */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-green-500"></div>
            <span>Improving trajectory</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500"></div>
            <span>Stable trajectory</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-500"></div>
            <span>Declining trajectory</span>
          </div>
          <div className="ml-auto text-slate-500">
            All journeys are anonymized • You control your sharing
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      {sharingStatus && (
        <div className="p-4 bg-blue-900/20 border-t border-blue-500/50">
          <p className="text-xs text-slate-300">
            <strong className="text-white">You're sharing:</strong> Your trajectory points are
            visible to cohort members as anonymous data. Your identity remains protected.
          </p>
        </div>
      )}
    </div>
  );
}
