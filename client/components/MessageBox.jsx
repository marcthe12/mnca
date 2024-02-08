import Hide from "./Hide.jsx";
import { useState, useEffect } from "react";
import { useUser } from "./UserProvider.jsx";
import { isDefined } from "../utils.js";

export default function MessageBox({ message, onThread, onDelete, recpt }) {
	const user = useUser();
	const { messageId: id, name, "message": msg, date } = message;
	const [menu, setMenu] = useState(false);
	const [data, setData] = useState(null);
	useEffect(
		() => {
			(async () => {
				const res = await user.filetable.get(msg);
				setData(res);
				if (!isDefined(res)) {
					await user.filetable.requestFile(msg, recpt,id, file => setData(file));
				}
			})();
		},
		[]
	);

	function handleClick() {
		setMenu(!menu);
	}

	async function copy() {
		await navigator.clipboard.writeText(data);
	}

	async function download() {
		const blob = data instanceof File ? data : new File([data], id, { type: "text/plain", lastModified: date });
		const link = document.createElement("a");
		const blobUrl = URL.createObjectURL(blob);
		link.download = blob.name;
		link.href = blobUrl;
		document.body.append(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(blobUrl);
	}
	const isCurrentUser = user && user.name === name;
	return <section className={`max-w-sm rounded overflow-hidden shadow-lg bg-secondary-bg text-secondary-text m-5 p-4 ${isCurrentUser ? "ml-auto" : "mr-auto"
	}`} onClick={() => handleClick()}>
		<Hide show={menu}>
			<div className="relative w-full mt-2 w-48 rounded-md shadow-lg bg-menu-bg ring-1 ring-black ring-opacity-5">
				<div className="px-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
					<button onClick={() => onThread(message)}
						className="px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
						role="menuitem"
					>
						Reply
					</button>
					<button
						onClick={download}
						className="px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
						role="menuitem"
					>
						Download
					</button>
					<Hide show={!(data instanceof Blob)}>
						<button
							onClick={copy}
							className="px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
							role="menuitem"
						>
							Copy
						</button>
					</Hide>
					<button
						onClick={() => onDelete(message)}
						className="px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
						role="menuitem"
					>
						Delete
					</button>
				</div>
			</div>
		</Hide>
		<h3 className="font-bold">{name}</h3>
		<MessageView message={data} onDownload={download} />
		<small><time>{date.toLocaleString()}</time></small>
	</section>;
}

function MessageView({ message, onDownload }) {
	if (!isDefined(message)) {
		return <p className="italic">loading...</p>;
	} else if (message instanceof File) {
		return <button
			onClick={onDownload}
			className="block w-full px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left">
			Download - {message.name}
		</button>;
	}
	else {
		return message.split("\n").map((line, i) => <p className="break-words" key={i}>{line}</p>);
	}
}
