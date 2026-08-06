import { useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

function App() {
  const [status, setStatus] = useState('idle')
  const [response, setResponse] = useState('')

  const pingApi = async () => {
    setStatus('loading')
    try {
      const res = await fetch(`${API_BASE_URL}/api/ping`)
      const text = await res.text()
      setResponse(text)
      setStatus(res.ok ? 'success' : 'error')
    } catch (err) {
      setResponse(err.message)
      setStatus('error')
    }
  }

  return (
    <main className="app">
      <h1>Mealiver-IT</h1>
      <p>프론트엔드 &harr; 백엔드 연결 테스트용 페이지입니다.</p>

      <button type="button" onClick={pingApi} disabled={status === 'loading'}>
        {status === 'loading' ? 'Pinging...' : 'Ping API'}
      </button>

      {status !== 'idle' && (
        <p className={`result ${status}`}>
          <strong>{API_BASE_URL}/api/ping</strong> &rarr; {response}
        </p>
      )}
    </main>
  )
}

export default App
