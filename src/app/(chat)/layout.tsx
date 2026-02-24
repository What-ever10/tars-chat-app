import { ReactNode } from "react";
import { UserList } from "@/components/sidebar/user-list";

export default function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <aside className="w-80 border-r border-gray-200 p-4">
        <UserList />
      </aside>

      <main className="flex-1">{children}</main>
    </div>
  );
}