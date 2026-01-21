"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function NotificationCenter({ userId, serverActions }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchInitial = async () => {
      const res = await serverActions.handleFetchNotifications(userId);
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.notifications.filter((n) => !n.read).length);
      }
    };

    fetchInitial();

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, serverActions]);

  const markAllRead = async () => {
    const res = await serverActions.handleMarkAllAsRead(userId);
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (e, id) => {
    e.stopPropagation();
    const res = await serverActions.handleDeleteNotification(id);
    if (res.success) {
      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.id !== id);
        const wasUnread = prev.find((n) => n.id === id && !n.read);
        if (wasUnread)
          setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
        return filtered;
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[350px] p-0 shadow-xl border border-gray-200"
      >
        <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
          <h3 className="font-bold text-sm text-gray-700">Powiadomienia</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="text-[11px] h-7 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <CheckCheck size={14} /> Odczytaj wszystkie
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500 italic">
              Brak powiadomień
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`group flex items-start justify-between p-4 border-b last:border-0 transition-colors hover:bg-gray-50 ${
                  !n.read ? "bg-blue-50/40" : ""
                }`}
              >
                <div className="flex-1 pr-2">
                  <p
                    className={`text-sm leading-tight mb-1 ${!n.read ? "font-semibold text-gray-900" : "text-gray-600"}`}
                  >
                    {n.content}
                  </p>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(n.created_at).toLocaleString("pl-PL", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* PRZYCISK USUWANIA - widoczny po najechaniu (group-hover) lub zawsze na mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => deleteNotification(e, n.id)}
                  className="h-7 w-7 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
