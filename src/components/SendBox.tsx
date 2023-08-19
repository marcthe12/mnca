'use client';

import { useState } from "react";

export function SendBox({onSend}: {onSend: (message: string) => void}) {

  const [messageContent, setMessageContent] = useState('')

  async function handleClick() {
    await onSend(messageContent);
  }

  return (
    <div>
      <textarea value={messageContent} onChange={e => setMessageContent(e.target.value)} ></textarea>
      <button className="rounded-full bg-sky-500 p-1" onClick={handleClick}>send</button>
    </div>
  );
}
