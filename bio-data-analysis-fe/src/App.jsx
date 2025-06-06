import React from 'react';
import RequirementForm from './ui_components/requirementForm';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <ThemeToggle />
        <RequirementForm />
      </div>
    </ThemeProvider>
  );
}

export default App;