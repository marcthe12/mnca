import React, { useState } from 'react'
import { useUser } from './UserProvider.jsx'

export default function RegistrationForm() {
  const user = useUser()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    // Call the NextAuth.js registration API
    const response = await fetch('/register', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(
        {
          username,
          password,
        })
    })

    if (response.error) {
      console.error('Registration failed:', response.error)
    } else {
      console.log('Registration successful:', response)
      user.signIn(username, password)
    }
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