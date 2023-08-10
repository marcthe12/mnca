// Layout.tsx

import React from 'react';
import UserMenu from './UserMenu'; // Create this component for the user menu
import MainChatArea from './MainChatArea'; // Create this component for the chat area

const Layout: React.FC = () => {
  return (
    <div className="layout">
      <div className="user-menu">
        <UserMenu />
      </div>
      <div className="chat-area">
        <MainChatArea />
      </div>
    </div>
  );
};

export default Layout;
