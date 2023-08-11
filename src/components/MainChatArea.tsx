'use client'

import { useContext, useState } from 'react';
import { MessageBox } from './MessageBox';
import { SendBox } from './SendBox';

interface message {
  name: string,
  message: string,
  date: Date,
}

export default function MainChatArea({ label, isactive }: { label: string, isactive: boolean }) {
  const user = "Marc"
  const [messages, setMessages] = useState<message[]>([]);

  function SendHandler(message: string) {
    setMessages([...messages, { name: user, message, date: new Date() }])
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
