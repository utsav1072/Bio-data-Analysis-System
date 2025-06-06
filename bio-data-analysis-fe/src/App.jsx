import React from 'react';
import RequirementForm from './ui_components/requirementForm';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import { motion } from 'framer-motion';

function App() {
  return (
    <ThemeProvider>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200"
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
        >
          <ThemeToggle />
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            delay: 0.2,
            duration: 0.5,
            type: "spring",
            stiffness: 100
          }}
        >
          <RequirementForm />
        </motion.div>
      </motion.div>
    </ThemeProvider>
  );
}

export default App;