"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  UserPlus,
  UserCheck,
  Trash2,
  Clock,
  Loader2,
  Search,
  SendHorizontal,
} from "lucide-react";

export default function FriendsListModal({
  user,
  open,
  onClose,
  serverActions,
}) {
  const [friends, setFriends] = useState({ accepted: [], pending: [] });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(new Set());

  const [searchQuery, setSearchQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await serverActions.handleFetchUserFriends(user.id);
      if (result.success) {
        setFriends({
          accepted: result.data.filter((f) => f.status === "accepted"),
          pending: result.data.filter((f) => f.status === "requested"),
        });
      }
    } catch (error) {
      console.error("Błąd ładowania znajomych:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
      setSearchQuery("");
      setSearchStatus({ loading: false, error: null, success: false });
    }
  }, [open, user?.id]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchStatus({ loading: true, error: null, success: false });
    const result = await serverActions.handleSendFriendRequest(
      user.id,
      searchQuery.trim(),
    );

    if (result.success) {
      setSearchStatus({ loading: false, error: null, success: true });
      setSearchQuery("");
      loadData();
      setTimeout(
        () => setSearchStatus((prev) => ({ ...prev, success: false })),
        3000,
      );
    } else {
      setSearchStatus({ loading: false, error: result.error, success: false });
    }
  };

  const handleAction = async (actionFn, friendId) => {
    setProcessing((prev) => new Set(prev).add(friendId));
    const result = await actionFn(friendId, user.id);
    if (result.success) await loadData();
    setProcessing((prev) => {
      const newSet = new Set(prev);
      newSet.delete(friendId);
      return newSet;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b bg-white">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            Znajomi
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 bg-white border-b">
          <form onSubmit={handleInvite} className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Dodaj nowego znajomego
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Wpisz nazwę użytkownika..."
                  className="pl-10 h-10 border-gray-200 focus-visible:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={searchStatus.loading || !searchQuery}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4"
              >
                {searchStatus.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SendHorizontal className="w-4 h-4" />
                )}
              </Button>
            </div>
            {searchStatus.error && (
              <p className="text-xs text-red-500 mt-1 font-medium">
                {searchStatus.error}
              </p>
            )}
            {searchStatus.success && (
              <p className="text-xs text-green-600 mt-1 font-medium">
                Zaproszenie wysłane!
              </p>
            )}
          </form>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 bg-gray-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500 font-medium text-sm">
                Pobieranie listy...
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 py-4">
              {friends.pending.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-3 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Oczekujące ({friends.pending.length})
                  </h3>
                  <div className="grid gap-2">
                    {friends.pending.map((f) => (
                      <FriendRow
                        key={f.id}
                        friend={f}
                        isProcessing={processing.has(f.id)}
                        onAccept={() =>
                          handleAction(
                            serverActions.handleAcceptFriendRequest,
                            f.id,
                          )
                        }
                        onRemove={() =>
                          handleAction(serverActions.handleRemoveFriend, f.id)
                        }
                        type="pending"
                      />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 mb-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Twoi znajomi ({friends.accepted.length})
                </h3>
                {friends.accepted.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm">
                      Brak zaakceptowanych znajomych
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {friends.accepted.map((f) => (
                      <FriendRow
                        key={f.id}
                        friend={f}
                        isProcessing={processing.has(f.id)}
                        onRemove={() =>
                          handleAction(serverActions.handleRemoveFriend, f.id)
                        }
                        type="accepted"
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Komponent pomocniczy dla pojedynczego wiersza znajomego
 */
function FriendRow({ friend, isProcessing, onAccept, onRemove, type }) {
  return (
    <div className="group border border-gray-100 rounded-xl p-3 bg-white hover:border-blue-100 hover:shadow-sm transition-all flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-sm border border-blue-100 uppercase">
          {friend.name.charAt(0)}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">{friend.name}</h4>
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <Mail size={10} /> {friend.email}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {type === "pending" ? (
          friend.initiatedByMe ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={isProcessing}
              className="text-[11px] h-7 text-gray-400 hover:text-red-500"
            >
              {isProcessing ? "..." : "Anuluj"}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                onClick={onAccept}
                disabled={isProcessing}
                className="text-[11px] h-7 bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? "..." : "Akceptuj"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                disabled={isProcessing}
                className="text-[11px] h-7 text-red-500 hover:bg-red-50"
              >
                Odrzuć
              </Button>
            </>
          )
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (
                confirm(
                  `Czy na pewno chcesz usunąć użytkownika ${friend.name} ze znajomych?`,
                )
              ) {
                onRemove();
              }
            }}
            disabled={isProcessing}
            className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
