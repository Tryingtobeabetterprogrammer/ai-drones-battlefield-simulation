import React from 'react';
import { SimulationProvider } from './context/SimulationContext';
import { Battlefield } from './components/Battlefield';
import { Dashboard } from './components/Dashboard';
import { useDroneAI } from './hooks/useDroneAI';
import './App.css';

const AIRunner = () => {
  useDroneAI();
  return null;
};

function App() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative font-sans">
      <SimulationProvider>
        <AIRunner />
        <Battlefield />
        <Dashboard />
      </SimulationProvider>
    </div>
  );
}

export default App;
