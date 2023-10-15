import {useEffect, useState} from "react"
import MessageBox from "./MessageBox.jsx"
import SendBox from "./SendBox.jsx"
import Hide from "./Hide.jsx"
import {useUser} from "./UserProvider.jsx"
import AddUserModal from "./AddUserModal.jsx"

export default function MainChatArea ({group, isactive}) {
	const [messages, setMessages] = useState([])
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
	const user = useUser()
	
	async function SendHandler (message) {

		user.addNewMessage(group.groupId,message)

	}

	useEffect(
		() => {

			user.onMessageGroupChange[group.groupId] = (newmessage) => setMessages(newmessage)
			user.getGroupMessages(group.groupId)
			return () => user.onMessageGroupChange[group.groupId] = undefined
		},
		[
			user
		]
	)
	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen)
	  }
	
	  const toggleAddUserModal = () => {
		setIsAddUserModalOpen(!isAddUserModalOpen)
	  }
	  const handleAddUser = (newUser) => {
		console.log(`Adding user: ${newUser}`)
		setIsAddUserModalOpen(false)
	  }
	
	return <Hide show={isactive}>
		<main className="grid grid-rows-[auto,1fr,auto] h-full">
			<div className="grid-row-1 bg-primary-bg p-4">
				<h2>{group.name}</h2>
			</div>
			<div className="grid-row-2 overflow-y-auto">
				{messages.map((message) => <MessageBox key={message.messageId} message={message} />)}
			</div>
			<div className="grid-row-3 p-4">
				<SendBox onSend={SendHandler} />
			</div>
		</main >
	</Hide >
}
