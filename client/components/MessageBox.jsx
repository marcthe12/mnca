import Hide from './Hide.jsx'
import { useState } from 'react'

export default function MessageBox({ message }) {
	const { messageId: id, name, "message": msg, date } = message

	const [menu, setMenu] = useState(false)

	function handleClick() {
		setMenu(!menu)
	}

	async function copy() {
		await navigator.clipboard.writeText(msg)
	}

	async function download(){
		console.log(msg)
		const blob = new File([msg], id, {type: "text/plain", lastModified: date})
		const link = document.createElement('a')
		const blobUrl = URL.createObjectURL(blob)
		link.download = blob.name
		link.href = blobUrl
		console.log(link)
		document.body.append(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(blobUrl)
	}

	return <section className="bg-secondary-bg text-secondary-text m-5 w-1/2 p-4" onClick={() => handleClick()}>
		<Hide show={menu}>
			<div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-menu-bg ring-1 ring-black ring-opacity-5">
				<div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
					<button
						className="block w-full px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
						role="menuitem"
					>
						Reply
					</button>
					<button
						onClick={download}
						className="block w-full px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
						role="menuitem"
					>
						Download
					</button>
					<button
						onClick={copy}
						className="block w-full px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
						role="menuitem"
					>
						Copy
					</button>
					<button
						className="block w-full px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
						role="menuitem"
					>
						Delete
					</button>
				</div>
			</div>
		</Hide>
		<h3>{name}</h3>
		<p>{msg}</p>
		<small><time>{date.toLocaleString()}</time></small>
	</section>

}

