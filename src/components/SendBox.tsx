'use client';

import { useState } from "react";

export default function({onSend}: {onSend: (message: string) => void}) {

  const [messageContent, setMessageContent] = useState('')

  async function handleClick() {
    await onSend(messageContent);
    setMessageContent("")
  }

  return (
    <div className="grid grid-cols-[1fr,auto]">
      <textarea
        value={messageContent}
        onChange={e => setMessageContent(e.target.value)}
        className="resize-none border-2 h-fill grid-cols-1"
      ></textarea>
      <button className="rounded-full bg-sky-500 p-1 grid-cols-2" onClick={handleClick}>send</button>
    </div>
  );
}
