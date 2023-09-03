import React, { useState } from 'react'
import { useUser } from './UserProvider.jsx'
import api from '../api.js'

export default function RegistrationForm() {
  const user = useUser()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const registerRequest = api('/register') 

  async function handleSubmit(e) {
    e.preventDefault()

    await registerRequest({
      username,
      password,
    })

    await user.signIn(username, password)
  }

  function handleUsernameChange(e) {
    setUsername(e.target.value)
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value)
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={handleUsernameChange} />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange} />
        <button type="submit">Register</button>
      </form>
    </div>
  )
}
