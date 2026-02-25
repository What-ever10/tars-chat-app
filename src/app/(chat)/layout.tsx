import { ReactNode } from "react";
import { ConversationList } from "@/components/sidebar/conversation-list";
import { CurrentUserBar } from "@/components/sidebar/current-user-bar";
import { NewChatButton } from "@/components/sidebar/new-chat-button";

export default function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-200 flex flex-col">
          <CurrentUserBar />

          <div className="p-4 border-b">
            <NewChatButton />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <ConversationList />
          </div>
        </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col bg-gray-50">
        {children}
      </main>
    </div>
  );
}