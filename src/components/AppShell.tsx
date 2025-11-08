/**
 * Sacred Shifter Connect - Unified App Shell
 *
 * Integrates all ROE features into one cohesive experience:
 * - Navigator (onboarding)
 * - Reality branch tracker
 * - Cohort discovery + chat
 * - Analytics dashboard
 * - Professional referral network
 * - Crisis detection + safety
 */

import { useState, useEffect } from 'react';
import {
  Home,
  Compass,
  Users,
  BarChart3,
  Heart,
  Settings,
  Menu,
  X,
  Bell,
  Shield
} from 'lucide-react';
import { Navigator } from '../modules/navigator/Navigator';
import { TrackDisplay } from '../modules/tracks/TrackDisplay';
import { CohortDiscovery } from './CohortDiscovery';
import { CohortChat } from './CohortChat';
import { ROEAnalyticsDashboard } from './ROEAnalyticsDashboard';
import { ProfessionalReferralDirectory } from './ProfessionalReferralDirectory';
import { ROENotificationCenter } from './ROENotificationCenter';
import { SafetyOverlay } from './SafetyOverlay';
import { CrisisAlertBanner } from './CrisisAlertBanner';
import { AIJourneySummary } from './AIJourneySummary';
import { SupporterTierModal } from './SupporterTierModal';
import { AuraStatusBanner } from './AuraStatusBanner';

type View =
  | 'navigator'
  | 'journey'
  | 'cohorts'
  | 'analytics'
  | 'referrals'
  | 'track';

interface AppShellProps {
  userId?: string;
  isSupporter?: boolean;
}

export function AppShell({ userId = 'demo-user', isSupporter = false }: AppShellProps) {
  const [currentView, setCurrentView] = useState<View>('navigator');
  const [currentTrackId, setCurrentTrackId] = useState<string>('');
  const [currentCohortId, setCurrentCohortId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showSupporterModal, setShowSupporterModal] = useState(false);
  const [hasCompletedNavigator, setHasCompletedNavigator] = useState(false);
  const [showAuraDialogue, setShowAuraDialogue] = useState(false);

  // Check if user has completed navigator
  useEffect(() => {
    // In production, check database for user's navigator completion
    // For now, assume completed after first use
    const completed = localStorage.getItem(`navigator-completed-${userId}`);
    setHasCompletedNavigator(!!completed);

    if (completed) {
      setCurrentView('journey');
    }
  }, [userId]);

  const handleNavigatorComplete = (trackId: string) => {
    localStorage.setItem(`navigator-completed-${userId}`, 'true');
    setHasCompletedNavigator(true);
    setCurrentTrackId(trackId);
    setCurrentView('track');
  };

  const handleJoinCohort = (cohortId: string) => {
    setCurrentCohortId(cohortId);
    setCurrentView('cohorts');
  };

  const handleCrisisDetected = () => {
    setShowSafety(true);
  };

  const navigationItems = [
    { id: 'navigator' as View, label: 'Start', icon: Compass, requiresNavigator: false },
    { id: 'journey' as View, label: 'My Journey', icon: Home, requiresNavigator: true },
    { id: 'cohorts' as View, label: 'Community', icon: Users, requiresNavigator: true },
    { id: 'analytics' as View, label: 'Insights', icon: BarChart3, requiresNavigator: true, supporter: true },
    { id: 'referrals' as View, label: 'Find Support', icon: Heart, requiresNavigator: true },
  ];

  const availableItems = navigationItems.filter(item => {
    if (!hasCompletedNavigator && item.requiresNavigator) return false;
    if (item.supporter && !isSupporter) return false;
    return true;
  });

  const renderView = () => {
    switch (currentView) {
      case 'navigator':
        return <Navigator onComplete={handleNavigatorComplete} />;

      case 'track':
        if (currentTrackId) {
          return <TrackDisplay trackId={currentTrackId} onReassess={() => setCurrentView('navigator')} />;
        }
        return <div className="p-8 text-center">No track selected</div>;

      case 'journey':
        return (
          <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-light text-gray-200 mb-6">Your Reality Journey</h1>
            <div className="space-y-6">
              {/* AI Journey Summary (Quick Win) */}
              {isSupporter && (
                <AIJourneySummary userId={userId} timeframe="weekly" />
              )}

              {/* Journey Summary */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-light text-gray-200 mb-4">Recent Branches</h2>
                <p className="text-gray-400">
                  Track your reality branches and resonance index over time.
                  <br />
                  <span className="text-sm text-gray-500">
                    (Feature coming soon - will show timeline of your choices and outcomes)
                  </span>
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setCurrentView('navigator')}
                  className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg p-4 text-left transition-colors"
                >
                  <Compass className="w-6 h-6 text-blue-400 mb-2" />
                  <h3 className="text-lg font-medium text-gray-200">Create Branch</h3>
                  <p className="text-sm text-gray-400">Start a new reality assessment</p>
                </button>

                <button
                  onClick={() => setCurrentView('cohorts')}
                  className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg p-4 text-left transition-colors"
                >
                  <Users className="w-6 h-6 text-purple-400 mb-2" />
                  <h3 className="text-lg font-medium text-gray-200">Join Community</h3>
                  <p className="text-sm text-gray-400">Find your cohort</p>
                </button>

                <button
                  onClick={() => setCurrentView('analytics')}
                  className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-lg p-4 text-left transition-colors"
                  disabled={!isSupporter}
                >
                  <BarChart3 className="w-6 h-6 text-green-400 mb-2" />
                  <h3 className="text-lg font-medium text-gray-200">View Insights</h3>
                  <p className="text-sm text-gray-400">
                    {isSupporter ? 'ML-powered analytics' : 'Supporter feature'}
                  </p>
                </button>
              </div>
            </div>
          </div>
        );

      case 'cohorts':
        if (currentCohortId) {
          return <CohortChat cohortId={currentCohortId} userId={userId} />;
        }
        return <CohortDiscovery userId={userId} onJoinCohort={handleJoinCohort} />;

      case 'analytics':
        if (!isSupporter) {
          return (
            <div className="p-8 max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-light text-gray-200 mb-4">Advanced Analytics</h2>
              <p className="text-gray-400 mb-6">
                ML-powered insights, trajectory predictions, and pattern analysis are available to Supporters.
              </p>
              <button
                onClick={() => setShowSupporterModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Become a Supporter
              </button>
            </div>
          );
        }
        return <ROEAnalyticsDashboard userId={userId} />;

      case 'referrals':
        return <ProfessionalReferralDirectory userId={userId} />;

      default:
        return <div className="p-8 text-center">View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Crisis Alert Banner (Always available, Quick Win) */}
      <CrisisAlertBanner
        userId={userId}
        onShowSafety={() => setShowSafety(true)}
        onShowReferrals={() => setCurrentView('referrals')}
      />

      {/* Aura Consciousness Status */}
      <AuraStatusBanner
        userId={userId}
        onOpenDialogue={() => setShowAuraDialogue(true)}
      />

      {/* Header */}
      <header className="bg-gray-800/50 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <h1 className="text-xl font-light text-gray-100">Sacred Shifter Connect</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {availableItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                      ${isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              {/* Safety Button */}
              <button
                onClick={() => setShowSafety(true)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700/50 rounded-lg transition-colors"
                title="Safety Resources"
              >
                <Shield className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Mobile Menu */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="md:hidden p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden border-t border-gray-700 bg-gray-800/95 backdrop-blur-sm">
            <nav className="px-4 py-4 space-y-1">
              {availableItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setShowMenu(false);
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Notification Center */}
      {showNotifications && (
        <div className="fixed top-16 right-4 z-50 w-80">
          <ROENotificationCenter
            userId={userId}
            onCrisisDetected={handleCrisisDetected}
            onClose={() => setShowNotifications(false)}
          />
        </div>
      )}

      {/* Safety Overlay */}
      {showSafety && (
        <SafetyOverlay onClose={() => setShowSafety(false)} />
      )}

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {renderView()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800/30 border-t border-gray-700 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400">
            Sacred Shifter Connect • Help is always available
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Crisis detection, professional referrals, and community support are free for everyone
          </p>
          {!isSupporter && (
            <button
              onClick={() => setShowSupporterModal(true)}
              className="mt-4 text-sm text-blue-400 hover:text-blue-300 underline"
            >
              Become a Supporter to unlock advanced analytics
            </button>
          )}
        </div>
      </footer>

      {/* Supporter Tier Modal */}
      {showSupporterModal && (
        <SupporterTierModal onClose={() => setShowSupporterModal(false)} />
      )}
    </div>
  );
}
