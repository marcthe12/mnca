import { useState } from "react";

export default function({onSend}) {

  const [messageContent, setMessageContent] = useState('')

  async function handleClick() {
    await onSend(messageContent);
    setMessageContent("")
  }

  return (
    <div className="grid grid-cols-[1fr,auto]">
      <input
        type="text"
        onChange={e => setMessageContent(e.target.value)}
        contentEditable={true}
        value={messageContent}
        className="resize-none border-2 h-fill grid-cols-1"
      />
      <button className="rounded-full bg-secondary-bg p-1 grid-cols-2" onClick={handleClick}>send</button>
    </div>
  );
}
