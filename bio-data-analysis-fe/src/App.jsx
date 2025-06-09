import React, { useState, useEffect } from 'react'
import AnalysisFrom from './components/analysisFrom'

const App = () => {
  const [isHealthy, setIsHealthy] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const MAX_ATTEMPTS = 5
    const INTERVAL = 5000 // 5 seconds
    let attempts = 0
    let timeoutId

    const checkHealth = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/health/')
        if (response.ok) {
          setIsHealthy(true)
          setError(null)
          setIsLoading(false)
        } else {
          throw new Error('Server is not healthy')
        }
      } catch (err) {
        attempts += 1
        if (attempts >= MAX_ATTEMPTS) {
          setError('Could not connect to backend server.')
          setIsLoading(false)
        } else {
          timeoutId = setTimeout(checkHealth, INTERVAL)
        }
      }
    }

    checkHealth()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Use the same gradient background as your example component
  const bgClass = "min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"

  if (isLoading) {
    return (
      <div className={bgClass}>
        <div className="flex flex-col items-center bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/30">
          <span className="inline-block w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-6"></span>
          <span className="text-gray-100 text-lg font-semibold mb-2">Starting application…</span>
          <span className="text-gray-200 text-sm">Starting application, please wait.</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={bgClass}>
        <div className="flex flex-col items-center bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/30">
          <span className="text-red-200 text-2xl font-bold mb-4">Error</span>
          <span className="text-gray-100 text-base text-center">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={bgClass}>
      <div className="w-full">
        <AnalysisFrom />
      </div>
    </div>
  )
}

export default App
