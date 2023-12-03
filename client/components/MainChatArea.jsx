import { useEffect, useState } from "react"
import MessageBox from "./MessageBox.jsx"
import SendBox from "./SendBox.jsx"
import Hide from "./Hide.jsx"
import { useUser } from "./UserProvider.jsx"
import GroupInfo from "./GroupInfo.jsx"
import Modal from "./Modal.jsx"

export default function MainChatArea({ group, isactive }) {
	const [messages, setMessages] = useState([])
	const [isModalOpen, setModalState] = useState(false)
	const user = useUser()

	async function SendHandler(message) {
		user.addNewMessage(group.groupId, message)
	}

	useEffect(
		() => {
			user.onMessageGroupChange[group.groupId] = (message) => {
				console.log(message)
				setMessages(message)
			}
			user.getGroupMessages(group.groupId)
			return () => user.onMessageGroupChange[group.groupId] = undefined
		}, [user])

	const ModalOpen = () => {
		setModalState(true)
	}

	const ModalClose = () => {
		setModalState(false)
	}

	return <Hide show={isactive}>
		<main className="grid grid-rows-[auto,1fr,auto] h-full">
			<div className="grid-row-1 bg-primary-bg p-4" onClick={() => ModalOpen()}>
				<h2>{group.name}</h2>
			</div>
			<Modal show={isModalOpen}>
				<GroupInfo group={group} onClose={() => ModalClose()} />
			</Modal>
			<div className="grid-row-2 overflow-y-auto">
				{messages.map((message) => <MessageBox key={message.messageId} message={message} />)}
			</div>
			<div className="grid-row-3 p-4">
				<SendBox onSend={SendHandler} />
			</div>
		</main >
	</Hide >
}
