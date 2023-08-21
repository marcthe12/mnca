'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react';
import MainChatArea from './MainChatArea';
import { useIndexDB, type group } from './IndexDBProvider';
import TabButton from './TabButton';
import UserMenu from './UserMenu';

export default function () {
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
    <div className='h-screen w-screen grid grid-rows-[auto,1fr] overflow-hidden'>
      <header className="bg-gray-800 grid-rows-1">
        <div>
          <Image width={50} height={50} src="/images/clogo.svg" alt="Chat Logo" />
        </div>
        <h1 className="text-sky-500 dark:text-sky-400">MNCA</h1>
      </header>
      <div className="flex h-full bg-gray-100 grid-rows-2 overflow-y-auto">
        <div className="bg-gray-500 text-white w-1/4">
          <UserMenu onGroupCreate={GroupAddHandler}></UserMenu>
          <nav>
            {(groups).map((tab, index) =>
              <TabButton key={index} onClick={() => setActiveTab(index)} group={tab}></TabButton>
            )}
          </nav>
        </div>
        <div className="w-3/4">
          {(groups).map((tab, index) =>
            <MainChatArea group={tab} isactive={index == activeTab} key={index} />
          )}
        </div>
      </div>
    </div>
  )
}


