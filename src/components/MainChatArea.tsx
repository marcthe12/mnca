'use client'

import { useState, useEffect } from 'react';
import { MessageBox } from './MessageBox';
import { SendBox } from './SendBox';
import { useSession } from "next-auth/react"
import { saveGroupData, fetchGroupData } from '../indexStorage';

interface message {
  name: string,
  message: string,
  date: Date,
}

export default function MainChatArea({ label, isactive }: { label: string, isactive: boolean }) {
  const [messages, setMessages] = useState<message[]>([]);
  const session = useSession()

  useEffect(() => {
    if (session.data?.user) {
      fetchGroupData(session.data.user.name, label).then((result) => {
        setMessages(result);
      });
    }
  }, [session.data, label]);

  function SendHandler(message: string) {
    const NewMessage = [...messages, { name: session.data.user.name, message, date: new Date() }]
    setMessages(NewMessage)
    saveGroupData(session.data.user.name, label, NewMessage)
  }

  return isactive ? (
    <main className="grid">
      <h2>{label}</h2>
      {messages.map(message =>
        <MessageBox key={crypto.randomUUID()} name={message.name} date={message.date}>
          {message.message}
        </MessageBox>
      )}
      <SendBox onSend={SendHandler} />
    </main>
  ) : (<></>);
}
