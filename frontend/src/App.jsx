import { useEffect } from 'react'

const App = () => {
  useEffect(() => {
    fetch('/api/test')
      .then(res => res.json())
      .then(data => {
        console.log('Backend response:', data)
      })
      .catch(err => {
        console.error('API error:', err)
      })
  }, [])

  return (
    <div>
      <p>BSL-game frontend</p>
    </div>
  )
}

export default App