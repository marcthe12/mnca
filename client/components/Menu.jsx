import { useState } from "react"
import Hide from "./Hide"
//
export default function Menu({ children }) {

	const [
		menuOpen,
		setMenuOpen
	] = useState(false)
	return <>
		<button
			type="button"
			onClick={() => setMenuOpen(!menuOpen)}
			className="rounded-md p-2 text-secondary-text hover:bg-menu-hover focus:outline-none"
			aria-label="Menu"
		>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
				<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
			</svg>
		</button>
		<Hide show={menuOpen}>
			<div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-menu-bg ring-1 ring-black ring-opacity-5">
				<div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
					{children}
				</div>
			</div>
		</Hide>
	</>

}
