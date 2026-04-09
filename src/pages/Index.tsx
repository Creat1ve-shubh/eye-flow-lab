import { AppProvider, useApp } from '@/context/AppContext';
import Dashboard from '@/components/Dashboard';
import PatientDetails from '@/components/PatientDetails';
import SelectMode from '@/components/SelectMode';
import Calibration from '@/components/Calibration';
import EyeCover from '@/components/EyeCover';
import EyeTest from '@/components/EyeTest';
import Results from '@/components/Results';

function AppScreens() {
  const { screen, isTransitioning } = useApp();

  return (
    <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {screen === 'dashboard' && <Dashboard />}
      {screen === 'patientDetails' && <PatientDetails />}
      {screen === 'selectMode' && <SelectMode />}
      {screen === 'calibration' && <Calibration />}
      {screen === 'eyeCover' && <EyeCover />}
      {screen === 'test' && <EyeTest />}
      {screen === 'results' && <Results />}
    </div>
  );
}

export default function Index() {
  return (
    <AppProvider>
      <AppScreens />
    </AppProvider>
  );
}
