import { useState } from "react"
import UploadModal from "./UploadModal"
import Modal from "./Modal"
export default function SendBox({ onSend }) {

	const [messageContent, setMessageContent] = useState("")
	const [show, setShow] = useState(false)

	async function handleClick() {
		await onSend(messageContent)
		setMessageContent("")
	}

	async function handleUpload() {

	}

	return (
		<div className="grid grid-cols-[1fr,auto,auto]">
			<input
				type="text"
				onChange={(e) => setMessageContent(e.target.value)}
				contentEditable={true}
				value={messageContent}
				className="resize-none border-2 h-fill grid-cols-1"
			/>
			<Modal show={show} >
				<UploadModal />
			</Modal>
			<input type="file" onChange={} style="display:none;"/>
			<button className="grids-cols-2" onClick={handleUpload}>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
					<path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
				</svg>
			</button>
			<button className="rounded-full bg-secondary-bg p-1 grid-cols-3" onClick={handleClick}>send</button>
		</div >
	)

}
