import { useState } from "react";
import MessageBox from "./MessageBox.jsx";
import SendBox from "./SendBox.jsx";
import Hide from "./Hide.jsx";
import { useUser } from "./UserProvider.jsx";
import GroupInfo from "./GroupInfo.jsx";
import Modal from "./Modal.jsx";

export default function MainChatArea({ group, isactive }) {
	const [isModalOpen, setModalState] = useState(false);
	const user = useUser();
	const [msgStack, setMsgStack] = useState([]);

	const { messages } = group;

	function PushToStack(msg) {
		setMsgStack([msg, ...msgStack]);
	}
	function PopFromStack() {
		setMsgStack(msgStack.slice(1));
	}
	async function SendHandler(message) {
		user.addNewMessage(group, message, msgStack[0]?.messageId);
	}

	const ModalOpen = () => {
		setModalState(true);
	};

	const ModalClose = () => {
		setModalState(false);
	};

	return <Hide show={isactive}>
		<main className="grid grid-rows-[auto,1fr,auto] h-full">
			<div className="grid-row-1 bg-primary-bg p-2">
				<Hide show={msgStack.length != 0}>
					<button className="inline p-2" onClick={PopFromStack}>X</button>
				</Hide>
				<button className="inline font-bold cursor-pointer shadow px-3 py-1" onClick={() => ModalOpen()}>{group.name}</button>
			</div>
			<Modal show={isModalOpen}>
				<GroupInfo group={group} onClose={() => ModalClose()} />
			</Modal>
			<div className="grid-row-2 overflow-y-auto">
				{[...messages]
					.filter(message =>
						message.messageId == msgStack[0]?.messageId || message.parentId == msgStack[0]?.messageId
					).map((message) =>
						<MessageBox key={message.messageId} message={message} onThread={PushToStack} onDelete={msg => user.removeMessage(msg)} recpt={group.users} />
					)}
			</div>
			<div className="grid-row-3 p-4">
				<SendBox onSend={SendHandler} />
			</div>
		</main >
	</Hide >;
}
