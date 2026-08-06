import { useState } from 'react'
import './App.css'

// Local dev: set VITE_API_BASE_URL in .env (see .env.example) to point at the backend directly.
// Production (nginx container): left unset on purpose, so requests go to '/api/...' on the
// same origin and nginx proxies them to the api container.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function App() {
  const [status, setStatus] = useState('idle')
  const [response, setResponse] = useState('')
  const [count, setCount] = useState(0)

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

      <hr />

      <p>배포 확인용 카운터 (이 버튼이 보이면 새 배포가 반영된 것)</p>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        Count: {count}
      </button>
    </main>
  )
}

export default App
