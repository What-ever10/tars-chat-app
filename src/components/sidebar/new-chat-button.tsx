"use client";

import { useState } from "react";
import { UserList } from "./user-list";

export function NewChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-md bg-black text-white py-2 text-sm"
      >
        New Chat
      </button>

      {open && (
        <div className="mt-3 border rounded-md p-3 bg-white shadow-sm">
          <UserList />
        </div>
      )}
    </div>
  );
}