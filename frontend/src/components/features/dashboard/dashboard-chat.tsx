'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare, Send, Loader2, AlertCircle, Clock, User } from 'lucide-react';
import { OrderSummaryDto, MessageDto } from '@academania/shared';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function DashboardChat() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [messages, setMessages] = useState<MessageDto[]>([]);

  // Loading & Error states
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Message input state
  const [content, setContent] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load orders list on load
  useEffect(() => {
    async function fetchOrders() {
      if (!session?.accessToken) return;
      try {
        setIsLoadingOrders(true);
        const data = await apiClient<OrderSummaryDto[]>('/orders', {
          token: session.accessToken,
        });
        setOrders(data);
        if (data.length > 0) {
          setSelectedOrderId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load orders.');
      } finally {
        setIsLoadingOrders(false);
      }
    }
    fetchOrders();
  }, [session?.accessToken]);

  // Load message history & set up polling
  useEffect(() => {
    if (!selectedOrderId || !session?.accessToken) return;

    let isMounted = true;

    async function fetchChatHistory(showLoader = false) {
      try {
        if (showLoader) setIsLoadingMessages(true);
        const history = await apiClient<MessageDto[]>(`/messages/${selectedOrderId}`, {
          token: session?.accessToken,
        });
        if (isMounted) {
          setMessages(history);
        }
      } catch (err: any) {
        console.error('Failed to load chat history:', err);
      } finally {
        if (showLoader && isMounted) setIsLoadingMessages(false);
      }
    }

    // Initial load with spinner
    fetchChatHistory(true);

    // Setup polling every 4 seconds for real-time-like sync
    const intervalId = setInterval(() => {
      fetchChatHistory(false);
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [selectedOrderId, session?.accessToken]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedOrderId || !session?.accessToken) return;

    const messageContent = content.trim();
    setContent('');

    try {
      setIsSending(true);
      setError(null);

      // Call API
      await apiClient(`/messages/${selectedOrderId}`, {
        method: 'POST',
        token: session.accessToken,
        body: JSON.stringify({ content: messageContent }),
      });

      // Refetch history immediately to update list
      const history = await apiClient<MessageDto[]>(`/messages/${selectedOrderId}`, {
        token: session.accessToken,
      });
      setMessages(history);
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoadingOrders) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto py-12 text-center">
        <CardContent className="flex flex-col items-center justify-center">
          <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-bold">No active conversations</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            You must place an order before starting a chat with an academic consultant.
          </p>
          <Button asChild className="mt-6">
            <a href="/order">Submit Your First Project</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academic Chat Support</h1>
        <p className="text-muted-foreground mt-2">
          Direct messaging channel with your assigned writer and admins.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 flex-1 overflow-hidden min-h-0">
        {/* Orders Selection Panel */}
        <div className="md:col-span-1 border rounded-xl bg-card overflow-y-auto p-4 flex flex-col space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground px-2">Select Project Chat</h3>
          <div className="space-y-1">
            {orders.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-all flex flex-col space-y-1 ${
                  selectedOrderId === o.id
                    ? 'border-primary bg-primary/5 text-primary-foreground'
                    : 'border-transparent hover:bg-muted/50'
                }`}
              >
                <span
                  className={`font-semibold ${selectedOrderId === o.id ? 'text-primary' : 'text-foreground'}`}
                >
                  {o.referenceNumber}
                </span>
                <span className="text-xs text-muted-foreground truncate">{o.serviceTitle}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area Panel */}
        <div className="md:col-span-3 border rounded-xl bg-card flex flex-col h-full overflow-hidden relative">
          {selectedOrder ? (
            <>
              {/* Chat Header */}
              <div className="border-b px-6 py-4 flex items-center justify-between bg-muted/10">
                <div>
                  <h2 className="font-bold text-base text-foreground">
                    {selectedOrder.referenceNumber}
                  </h2>
                  <p className="text-xs text-muted-foreground">{selectedOrder.serviceTitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-muted-foreground">Connected</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                    <MessageSquare className="h-10 w-10 text-muted/50 mb-3" />
                    <p className="font-semibold">Start the conversation</p>
                    <p className="text-xs max-w-xs mt-1">
                      Send a message to introduce yourself or clarify project instructions.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === session?.user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`flex gap-3 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {/* Avatar placeholder */}
                          <div
                            className={`h-8 w-8 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                              isMe
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <User className="h-4 w-4" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 px-1">
                              <span className="text-xs font-semibold text-muted-foreground">
                                {isMe ? 'You' : m.senderName}
                              </span>
                              <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <div
                              className={`rounded-2xl px-4 py-2 text-sm leading-relaxed border ${
                                isMe
                                  ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                  : 'bg-muted/50 border-border text-foreground'
                              }`}
                            >
                              {m.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t p-4 bg-muted/10">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-2 text-xs text-destructive mb-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <div>{error}</div>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type your message here..."
                    className="flex-1 bg-background"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isSending}
                    required
                  />
                  <Button type="submit" size="icon" disabled={isSending || !content.trim()}>
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground text-sm">
                Please select a project to start chatting.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
