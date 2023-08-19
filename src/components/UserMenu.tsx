'use client'

import { useEffect, useState } from 'react';
import MainChatArea from './MainChatArea';
import { signOut, useSession } from "next-auth/react"
import { useIndexDB, type group } from './IndexDBProvider';

export default function UserMenu() {
  const db = useIndexDB()
  const [activeTab, setActiveTab] = useState(0);
  const [tabs, setTabs] = useState<group[]>([]);

  

  useEffect(() => setTabs([{
    groupId: crypto.randomUUID(),
    name: "Tabs"
  },
  {
    groupId: crypto.randomUUID(),
    name: "1"
  }]), [])

  return (
    <div className='container'>
      <nav className="bg-gray-500">
        <Username></Username>
        {(tabs).map((tab, index) =>
          <TabButton key={index} onClick={() => setActiveTab(index)} group={tab}></TabButton>
        )}
      </nav>
      {(tabs).map((tab, index) =>
        <MainChatArea group={tab} isactive={index == activeTab} key={index} />
      )}
    </div>
  )
}

function TabButton({ onClick, group }: { onClick: () => void, group: group }): JSX.Element {
  return <p onClick={onClick}>{group.name}</p>
}

function Username(): JSX.Element {
  const session = useSession()

  if (session.status !== "authenticated") {
    return <></>
  }
  return <div className="flex items-center space-x-4 mb-4">
    <img
      src="/path-to-user-avatar.jpg"
      alt="User Avatar"
      className="rounded-full w-10 h-10" />
    <div>
      <p className="font-semibold">{session.data.user?.name ?? ''}</p>
      <p className="text-gray-500">Online</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  </div>;
}

