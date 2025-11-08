import { useState } from 'react';
import { Navigator } from './modules/navigator/Navigator';
import { TrackDisplay } from './modules/tracks/TrackDisplay';

type AppState = 'navigator' | 'track';

function App() {
  const [appState, setAppState] = useState<AppState>('navigator');
  const [currentTrackId, setCurrentTrackId] = useState<string>('');

  const handleNavigatorComplete = (trackId: string) => {
    setCurrentTrackId(trackId);
    setAppState('track');
  };

  const handleReassess = () => {
    setAppState('navigator');
  };

  if (appState === 'track' && currentTrackId) {
    return <TrackDisplay trackId={currentTrackId} onReassess={handleReassess} />;
  }

  return <Navigator onComplete={handleNavigatorComplete} />;
}

export default App;
