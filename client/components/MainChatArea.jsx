import { useState, useEffect } from 'react'
import MessageBox from './MessageBox.jsx'
import SendBox from './SendBox.jsx'
import Hide from './Hide.jsx'
import { useIndexDB } from './IndexDBProvider.jsx'
import { useUser } from './UserProvider.jsx'
import AddUserModal from './AddUserModal.jsx';

export default function ({ group, isactive }) {
  const [messages, setMessages] = useState([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const user = useUser()
  const db = useIndexDB()

  async function ReloadMessage() {
    const message = await db?.getAllFromIndex('messages', 'groupIndex', group.groupId) ?? []
    setMessages(message)
  }

  async function SendHandler(message) {
    db.add('messages', {
      name: user.data.body.user,
      message,
      date: new Date(),
      groupId: group.groupId,
      messageId: crypto.getRandomValues(new Uint8Array(8)).toString()
    })
    await ReloadMessage()
  }
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  }

  const toggleAddUserModal = () => {
    setIsAddUserModalOpen(!isAddUserModalOpen);
  };

  const handleAddUser = (newUser) => {
    // Handle adding the user to the group (implement your logic here)
    console.log(`Adding user: ${newUser}`);
    // Close the modal
    setIsAddUserModalOpen(false);
  };
  useEffect(() => {
    ReloadMessage()
  }, [db, messages])

  return <Hide show={isactive}>
    <main className="grid grid-rows-[auto,1fr,auto] h-full">
      <div className="grid-row-1 bg-primary-bg p-4 flex justify-between">
        <h2>{group.name}</h2>
        <div className="relative inline-block text-left">
          <button
            onClick={toggleMenu}
            className="focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1"
              stroke="currentColor"
              class="h-6 w-6">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>
          {isMenuOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              <div className="py-1" role="none">
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" onClick={() => console.log("Manage Group")}>
                  Manage Group
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" onClick={toggleAddUserModal}>
                  Add User
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" onClick={() => console.log("Delete Group")}>
                  Delete Group
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className='grid-row-2 overflow-y-auto'>
        {messages.map((message) => (
          <MessageBox key={message.messageId} message={message} />
        ))}
      </div>
      <div className='grid-row-3 p-4'>
        <SendBox onSend={SendHandler} />
      </div>
    </main>
    <AddUserModal isOpen={isAddUserModalOpen} onClose={toggleAddUserModal} onAddUser={handleAddUser} />
  </Hide>
}
