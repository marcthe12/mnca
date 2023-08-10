import React from 'react';
import { MainArea } from './MainArea';
import { MessageBox } from './MessageBox';
import { SendBox } from './SendBox';

const MainChatArea: React.FC = () => {
  const messageData = {
    name: 'John',
    children: 'Hello there!',
    date: new Date(), // Create a new Date object
  };

  return (
    <div className="main-chat-area flex">
      <MainArea>
        <div className="flex flex-col h-full">
          <div className="flex-none">
            <MessageBox name={messageData.name} date={messageData.date}>
              {messageData.children}
            </MessageBox>
          </div>
          <div className="flex-grow">
            <SendBox />
          </div>
        </div>
      </MainArea>
    </div>
  );
};

export default MainChatArea;
