import { supabase } from '../lib/supabase'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    setMessage(error ? error.message : 'Login-Link wurde gesendet!')
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Login</h1>
      <input
        type="email"
        placeholder="Deine E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleLogin}>Login-Link senden</button>
      <p>{message}</p>
    </main>
  )
}
