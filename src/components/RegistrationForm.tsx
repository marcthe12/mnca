import React, { useState, ChangeEvent, FormEvent } from 'react';
import { signIn } from 'next-auth/react';


const RegistrationForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Call the NextAuth.js registration API
    const response = await signIn('registration', {
      username,
      password,
    });

    if (response.error) {
      console.error('Registration failed:', response.error);
    } else {
      console.log('Registration successful:', response);
    }
  };

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={handleUsernameChange}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
        />
        {/* Add input for profile picture */}
        <input type="file" accept="image/*" />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default RegistrationForm;
