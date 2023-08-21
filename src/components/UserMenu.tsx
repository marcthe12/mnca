'use client';
import { useState } from 'react';
import { signOut, useSession } from "next-auth/react";
import ModalContent from './ModalContent';
import Modal from './Modal';
import Menu from './Menu';

export default function({ onGroupCreate }: { onGroupCreate: (name: string) => void; }): JSX.Element {
  const session = useSession();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  function close() {
    setShowCreateGroupModal(false);
  }

  function open() {
    setShowCreateGroupModal(true);
  }

  async function handleCreateGroup(name: string) {
    onGroupCreate(name);
    close();
  }

  if (session.status !== "authenticated") {
    return <></>;
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-blue-400 shadow-md">
      <div className="flex items-center space-x-4">
        <img
          src="https://placekitten.com/250/250" // Replace with your actual image URL
          width={40}
          height={40}
          alt="User Avatar"
          className="rounded-full" />
        <div>
          <p className="font-semibold">{session.data.user.name}</p>
          <p className="text-lime-50">Online</p>
        </div>
      </div>
      <div className="relative inline-block text-left">
        <Menu>
          <button
            onClick={() => open()}
            className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-100 text-left"
            role="menuitem"
          >
            New Group
          </button>
          <Modal show={showCreateGroupModal}>
            <ModalContent onClose={close} onCreate={handleCreateGroup} />
          </Modal>
          <button
            onClick={() => signOut}
            className="block w-full px-4 py-2 text-gray-800 hover:bg-gray-100 text-left"
            role="menuitem"
          >
            Sign Out
          </button>
        </Menu>
      </div>
    </div>
  );
}
