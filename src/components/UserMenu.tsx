'use client'

import { useContext, useEffect, useState } from 'react';
import MainChatArea from './MainChatArea';


function UserMenu() {
  const user="marc"
  const [activeTab, setActiveTab] = useState(0);

  const [tabs, setTabs] = useState<string[]>(["Tabs", "1"]);

  return (
    <div className='container'>
      <nav className="bg-gray-500">
        <div className="flex items-center space-x-4 mb-4">
          <img
            src="/path-to-user-avatar.jpg"
            alt="User Avatar"
            className="rounded-full w-10 h-10" />
          <div>
            <p className="font-semibold">{user}</p>
            <p className="text-gray-500">Online</p>
          </div>
        </div>
        {tabs.map((tab, index) =>
          <p key={index} onClick={() => setActiveTab(index)}>{tab}</p>
        )}
      </nav>
      {tabs.map((tab, index) =>
        <MainChatArea label={tab} isactive={index == activeTab} key={index} />
      )}
    </div>
  )
}

export default UserMenu;
