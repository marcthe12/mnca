import { useState, useEffect } from 'react'
import MessageBox from './MessageBox.jsx'
import SendBox from './SendBox.jsx'
import Hide from './Hide.jsx'
import { useIndexDB } from './IndexDBProvider.jsx'
import { useUser } from './UserProvider.jsx'

export default function ({ group, isactive }) {
  const [messages, setMessages] = useState([])
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

  useEffect(() => {
    ReloadMessage()
  }, [db, messages])

  return <Hide show={isactive}>
    <main className="grid grid-rows-[auto,1fr,auto] h-full">
      <div className="grid-row-1 bg-primary-bg p-4">
        <h2>{group.name}</h2>
      </div>
      <div className='grid-row-2 overflow-y-auto'>
        {messages.map(message =>
          <MessageBox key={message.messageId} message={message} />
        )}
      </div>
      <div className='grid-row-3 p-4'>
        <SendBox onSend={SendHandler} />
      </div>
    </main >
  </Hide >


}
