import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="fade-in">
        <h1>BackBench</h1>
        <h2>Modern AI-Powered Development Platform</h2>
      </div>

      <div className="card fade-in">
        <h2>Welcome to BackBench</h2>
        <p>
          A cutting-edge platform that combines the power of AI with modern development tools.
          Build, deploy, and scale your applications with unprecedented ease.
        </p>

        <div className="button-group">
          <button className="button-primary" onClick={() => setCount((count) => count + 1)}>
            Get Started
          </button>
          <button className="button-secondary">
            Learn More
          </button>
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.9rem' }}>
          Click count: <code>{count}</code>
        </p>
      </div>

      <div className="feature-grid fade-in">
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <div className="feature-title">Lightning Fast</div>
          <div className="feature-description">
            Built with modern technologies for optimal performance and speed.
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎨</div>
          <div className="feature-title">Beautiful Design</div>
          <div className="feature-description">
            Clean, modern interface with attention to every detail.
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🚀</div>
          <div className="feature-title">Easy to Use</div>
          <div className="feature-description">
            Intuitive workflows that make development a breeze.
          </div>
        </div>
      </div>

      <p className="read-the-docs">
        Powered by modern web technologies
      </p>
    </>
  )
}

export default App
