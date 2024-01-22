import { useState } from "react"
import Hide from "./Hide"
import Bars3Icon from "@heroicons/react/24/solid/Bars3Icon"

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
			<Bars3Icon className="w-6 h-6"/>
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
