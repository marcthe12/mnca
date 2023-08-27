'use client'

import { useState, useEffect } from 'react';
import MessageBox from './MessageBox';
import SendBox from './SendBox';
import { useSession } from "next-auth/react"
import { useIndexDB, type group, type message } from "./IndexDBProvider";
import Hide from './Hide';

export default function ({ group, isactive }: { group: group, isactive: boolean }) {
  const [messages, setMessages] = useState<message[]>([]);
  const session = useSession()
  const db = useIndexDB()

  async function ReloadMessage() {
    const message = await db?.getAllFromIndex('messages', 'groupIndex', group.groupId) ?? [];
    setMessages(message);
  }

  async function SendHandler(message: string) {
    if (session.status === "authenticated" && db !== null) {
      db.add('messages', {
        name: session.data.user?.name ?? "",
        message,
        date: new Date(),
        groupId: group.groupId,
        messageId: crypto.getRandomValues(new Uint8Array(8)).toString()
      })
      await ReloadMessage();
    } else {
      throw Error("session")
    }
  }

  useEffect(() => {
    ReloadMessage()
  }, [db, messages])

  return <Hide show={isactive}>
    <main className="grid grid-rows-[auto,1fr,auto] h-full">
      <div className="grid-row-1 bg-gray-500 p-4">
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
  </Hide >;


}
