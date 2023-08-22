'use client';
import { useState } from 'react';

export default function ModalContent({ onCreate, onClose }: { onCreate: (name: string) => void; onClose: () => void; }) {
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
            onCreate(name);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Create
        </button>
      </div>
    </div>
  </>;
}