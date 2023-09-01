import { useState } from 'react';
import ModalContent from './ModalContent.jsx';
import Modal from './Modal.jsx';
import Menu from './Menu.jsx';
import { useUser } from './UserProvider.jsx';

export default function UserMenu({ onGroupCreate }){
  const user = useUser();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  function close() {
    setShowCreateGroupModal(false);
  }

  function open() {
    setShowCreateGroupModal(true);
  }

  async function handleCreateGroup(name) {
    onGroupCreate(name);
    close();
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-secondary-bg shadow-md">
      <div className="flex items-center space-x-4">
        <img
          src="https://placekitten.com/250/250" // Replace with your actual image URL
          width={40}
          height={40}
          alt="User Avatar"
          className="rounded-full" />
        <div>
          <p className="font-semibold">{user.data.body.user}</p>
          <p className="text-lime-50">Online</p>
        </div>
      </div>
      <div className="relative inline-block text-left">
        <Menu>
          <button
            onClick={() => open()}
            className="block w-full px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
            role="menuitem"
          >
            New Group
          </button>
          <Modal show={showCreateGroupModal}>
            <ModalContent onClose={close} onCreate={handleCreateGroup} />
          </Modal>
          <button
            onClick={() => user.signOut()}
            className="block w-full px-4 py-2 text-menu-text bg-menu-bg hover:bg-menu-hover text-left"
            role="menuitem"
          >
            Sign Out
          </button>
        </Menu>
      </div>
    </div>
  );
}
