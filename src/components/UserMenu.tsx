'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react';
import MainChatArea from './MainChatArea';
import { signOut, useSession } from "next-auth/react"
import { useIndexDB, type group } from './IndexDBProvider';

export default function UserMenu() {
  const db = useIndexDB()
  const [activeTab, setActiveTab] = useState(0);
  const [groups, setGroups] = useState<group[]>([]);

  async function GroupList() {
    const message = await db?.getAll('groups') ?? [];
    setGroups(message);
  }

  async function GroupAddHandler(name: string) {
    db?.add('groups', {
      name,
      groupId: crypto.randomUUID(),
    })
    await GroupList();
  }

  useEffect(() => {
    GroupList()
  }, [db, groups])

  return (
    <>
      <header className="bg-gray-800">
        <div className="logo-container">
          <Image width={50} height={50} src="/images/clogo.svg" alt="Chat Logo" />
        </div>
        <h1 className="text-sky-500 dark:text-sky-400">MNCA</h1>
      </header>
      <div className='container'>
        <nav className="bg-gray-500">
          <Username onGroupCreate={GroupAddHandler}></Username>
          {(groups).map((tab, index) =>
            <TabButton key={index} onClick={() => setActiveTab(index)} group={tab}></TabButton>
          )}
        </nav>
        {(groups).map((tab, index) =>
          <MainChatArea group={tab} isactive={index == activeTab} key={index} />
        )}
      </div>
    </>
  )
}

function TabButton({ onClick, group }: { onClick: () => void, group: group }): JSX.Element {
  return <p onClick={onClick}>{group.name}</p>
}

function Username({ onGroupCreate }: { onGroupCreate: (name: string) => void }): JSX.Element {
  const session = useSession()
  const [menuOpen, setMenuOpen] = useState(false);
  function handleSignOut() {
    signOut();
  }

  async function handleCreateGroup() {
    onGroupCreate("name")
  }

  if (session.status !== "authenticated") {
    return <></>
  }
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-blue-400 shadow-md">
      <div className="flex items-center space-x-4">
        <img
          src="https://placekitten.com/250/250" // Replace with your actual image URL
          alt="User Avatar"
          className="rounded-full w-10 h-10"
        />
        <div>
          <p className="font-semibold">{session.data.user.name}</p>
          <p className="text-lime-50">Online</p>
        </div>
      </div>
      <div className="relative inline-block text-left">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-md p-2 text-gray-800 hover:bg-white-100 focus:outline-none"
          aria-label="Menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              <button
                onClick={handleCreateGroup}
                className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-100 text-left"
                role="menuitem"
              >
                New Group
              </button>
              <button
                onClick={handleSignOut}
                className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-100 text-left"
                role="menuitem"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
