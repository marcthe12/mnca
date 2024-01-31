import { useLayoutEffect } from "react";
import { useRef, useState } from "react";
import 	PaperClipIcon from "@heroicons/react/24/solid/PaperClipIcon";

export default function SendBox({ onSend }) {

	const [messageContent, setMessageContent] = useState("");
	const fileInput = useRef(null);
	const textArea = useRef(null);

	useLayoutEffect(() => {
		textArea.current.style.height = "auto";
		textArea.current.style.height = `${Math.min(0.2 * window.innerHeight,textArea.current.scrollHeight)}px`;
	}, [messageContent]);

	async function handleClick() {
		await onSend(messageContent);
		setMessageContent("");
	}

	async function handleUpload(e) {
		const tar = e.target.files[0];
		e.target.value = "";
		await onSend(tar);
	}

	return (
		<div className="grid grid-cols-[1fr,auto,auto]">
			<textarea
				ref={textArea}
				onChange={e => setMessageContent(e.target.value)}
				value={messageContent}
				className="resize-none border-2 h-auto grid-cols-1"
			/>

			<input ref={fileInput} type="file" onChange={handleUpload} style={{ display: "none" }} />
			<button className="grids-cols-2" onClick={() => fileInput.current.click()}>
				<PaperClipIcon className="w-6 h-6" />
			</button>
			<button className="rounded-full bg-secondary-bg p-1 grid-cols-3" onClick={handleClick}>send</button>
		</div >
	);

}
