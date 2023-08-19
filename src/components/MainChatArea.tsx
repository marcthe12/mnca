'use client'

import { useState, useEffect } from 'react';
import { MessageBox } from './MessageBox';
import { SendBox } from './SendBox';
import { useSession } from "next-auth/react"
import { useIndexDB, type group, type message} from "./IndexDBProvider";

export default function MainChatArea({ group, isactive }: { group: group, isactive: boolean }) {
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
        messageId: crypto.randomUUID() 
      }) 
      await ReloadMessage();
    } else {
      throw Error("session")
    }
  }

  useEffect(() => { 
    ReloadMessage()
  }, [db, messages])

  return isactive ? (
    <main className="grid">
      <h2>{group.name}</h2>
      {messages.map(message =>
        <MessageBox key={message.messageId} message={message} />
      )}
      <SendBox onSend={SendHandler} />
    </main>
  ) : (<></>);


}
