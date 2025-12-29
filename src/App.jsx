import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { InterviewProvider } from './context/InterviewContext'
import Home from './pages/Home'
import Setup from './pages/Setup'
import Interview from './pages/Interview'
import Result from './pages/Result'
import Dashboard from './pages/Dashboard'
import './App.css'
import { useState } from 'react'

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <InterviewProvider>
      <BrowserRouter>
        <div className="app-shell">
          <header className="app-header">
            <div className="brand">AI Interview</div>
            <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
              <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>Home</NavLink>
              <NavLink to="/setup" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>Setup</NavLink>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
            </nav>
            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </header>
          <main className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/interview" element={<Interview />} />
              <Route path="/result" element={<Result />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
          <footer className="app-footer">© {new Date().getFullYear()} AI Interview Practice</footer>
        </div>
      </BrowserRouter>
    </InterviewProvider>
  )
}

export default App
