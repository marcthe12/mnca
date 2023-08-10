// Header.tsx

import React from 'react';
export function Header() {
  return (
    <header className="header">
      <div className="logo-container">
        <img src="/images/clogo.svg" alt="Chat Logo" className="logo" />
      </div>
      <h1 className="text-sky-500 dark:text-sky-400">MNCA</h1>
    </header>
  );
}
