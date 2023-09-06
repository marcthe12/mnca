import React, { useState } from 'react';

export default function AddUserModal({ isOpen, onClose, onAddUser }) {
  const [newUser, setNewUser] = useState('');

  const handleAddUser = () => {
    onAddUser(newUser);
    setNewUser('');
    onClose();
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
      <div className="modal">
        <h2>Add User</h2>
        <input
          type="text"
          placeholder="Enter username"
          value={newUser}
          onChange={(e) => setNewUser(e.target.value)}
        />
        <button onClick={handleAddUser}>Add</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}