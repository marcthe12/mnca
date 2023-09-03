import { useState } from 'react';
import Hide from './Hide';

export default function Menu({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <>
    <button
      type="button"
      onClick={() => setMenuOpen(!menuOpen)}
      className="rounded-md p-2 text-secondary-text hover:bg-menu-hover focus:outline-none"
      aria-label="Menu"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    <Hide show={menuOpen}>
      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-menu-bg ring-1 ring-black ring-opacity-5">
        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
          {children}
        </div>
      </div>
    </Hide>
  </>;
}
