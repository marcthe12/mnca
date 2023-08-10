// UserMenu.tsx

import React from 'react';

const UserMenu: React.FC = () => {
  return (
    <div className="user-menu p-4">
      <div className="flex items-center space-x-4 mb-4">
        <img
          src="/path-to-user-avatar.jpg"
          alt="User Avatar"
          className="rounded-full w-10 h-10"
        />
        <div>
          <p className="font-semibold">John Doe</p>
          <p className="text-gray-500">Online</p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-gray-600 font-semibold">Groups</p>
        <div className="border-t border-b py-2">
          <p className="text-blue-600 cursor-pointer hover:text-blue-800">
            Group A
          </p>
        </div>
        <div className="border-t border-b py-2">
          <p className="text-blue-600 cursor-pointer hover:text-blue-800">
            Group B
          </p>
        </div>
        {/* Add more group items as needed */}
      </div>
    </div>
  );
};

export default UserMenu;
