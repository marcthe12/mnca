import { useLayoutEffect } from "react";
import { useRef, useState } from "react";
import PaperClipIcon from "@heroicons/react/24/solid/PaperClipIcon";
import PaperAirplaneIcon from "@heroicons/react/24/solid/PaperAirplaneIcon";

export default function SendBox({ onSend }) {

	const [messageContent, setMessageContent] = useState("");
	const fileInput = useRef(null);
	const textArea = useRef(null);

	useLayoutEffect(() => {
		textArea.current.style.height = "auto";
		textArea.current.style.height = `${Math.min(0.2 * window.innerHeight, textArea.current.scrollHeight)}px`;
	}, [messageContent]);

	async function handleClick() {
		await onSend(messageContent);
		setMessageContent("");
	}

	async function handleUpload(e) {
		const tar = e.target.files[0];
		e.target.value = "";
		if (tar.size < 24 * 1024 * 1024) {
			await onSend(tar);
		} else {
			alert("File limit is 24 MiB");
		}
	}

	return (
		<div className="grid grid-cols-[1fr,auto,auto]">
			<textarea
				ref={textArea}
				onChange={e => setMessageContent(e.target.value)}
				value={messageContent}
				className="resize-none border border-primary-bg rounded-lg py-1 px-4 block w-full placeholder-gray-500 text-sm focus:outline-none  h-auto "
				placeholder="Type your message..."
			/>

			<input ref={fileInput} type="file" onChange={handleUpload} style={{ display: "none" }} />
			<button className="flex items-center justify-center p-2" onClick={() => fileInput.current.click()}>
				<PaperClipIcon className="w-7 h-6" />
			</button>
			<button className="flex items-center justify-center bg-menu-bg hover:bg-secondary-bg rounded-full px-1 py-1 text-white text-lg font-semibold shadow-md w-12 h-12 " onClick={handleClick}>
			<PaperAirplaneIcon className="w-7 h-6"></PaperAirplaneIcon>
			</button>
		</div >
	);

}
