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
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  function close() {
    setShowCreateGroupModal(false);
  }

  function open() {
    setShowCreateGroupModal(true);
  }

  function handleSignOut() {
    signOut();
  }

  async function handleCreateGroup(name: string) {
    onGroupCreate(name)
    close();
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
                onClick={open}
                className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-100 text-left"
                role="menuitem"
              >
                New Group
              </button>
              <Modal show={showCreateGroupModal}>
              <ModalContent onClose={close} onCreate={handleCreateGroup}/>
              </Modal>
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

function 

function Modal({ children, show }: { children: any, show: boolean }) {
  const [name, setName] = useState("");
  return show ? (<div className="fixed inset-0 z-50 flex items-center justify-center" >
    <div className="bg-white w-96 p-6 rounded-lg shadow-md">
      {children}
    </div>
  </div>
  ) : (<></>)
}

function ModalContent({ onCreate, onClose }: { onCreate: (name: string) => void, onClose: () => void }) {
  const [name, setName] = useState("");
  return <>
    <h2 className="text-xl font-semibold mb-4">Create a New Group</h2>
    <div className="mb-4">
      <label className="block font-medium mb-1">
        Group Name
        <input
          type="text"
          className="w-full border rounded-md p-2"
          placeholder="Enter group name"
          value={name}
          onChange={e => setName(e.target.value)}
        ></input>
      </label>
      <div className="flex justify-end">
        <button
          onClick={() => {
            onClose();
          }}
          className="px-4 py-2 bg-gray-300 rounded-md mr-2"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onCreate(name)
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Create
        </button>
      </div>
    </div>
  </>
}
