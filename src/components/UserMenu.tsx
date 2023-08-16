'use client'

import { useEffect, useState } from 'react';
import MainChatArea from './MainChatArea';
import { signOut,useSession,SessionProvider } from "next-auth/react"

export default function UserMenu() {
  const [activeTab, setActiveTab] = useState(0);

  const [tabs, setTabs] = useState<string[]>([]);

  useEffect(() => setTabs(["Tabs", "1"]),[])

  return (
    <SessionProvider>
    <div className='container'>
      <nav className="bg-gray-500">
        <Username></Username>
        {(tabs).map((tab, index) =>
          <TabButton key={index} onClick={() => setActiveTab(index)} name={tab}></TabButton>
        )}
      </nav>
      {(tabs).map((tab, index) =>
        <MainChatArea label={tab} isactive={index == activeTab} key={index} />
      )}
    </div>
    </SessionProvider>
  )
}

function TabButton({onClick, name}:{onClick: () => void, name: string}): JSX.Element {
  return <p onClick={onClick}>{name}</p>
}

function Username(): JSX.Element {
  const session = useSession()

  if(session.status !== "authenticated"){
    return <></>
  }
  return <div className="flex items-center space-x-4 mb-4">
    <img
      src="/path-to-user-avatar.jpg"
      alt="User Avatar"
      className="rounded-full w-10 h-10" />
    <div>
      <p className="font-semibold">{session.data.user.name}</p>
      <p className="text-gray-500">Online</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  </div>;
}

