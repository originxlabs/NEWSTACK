import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaceData } from "@/hooks/use-places";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PlaceChatProps {
  isOpen: boolean;
  onClose: () => void;
  placeData: PlaceData;
}

const suggestedQuestions = [
  "Is it safe at night?",
  "Best time to visit?",
  "Is it crowded now?",
  "What should I pack?",
  "Local food recommendations?",
];

export function PlaceChat({ isOpen, onClose, placeData }: PlaceChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Clear chat when place changes
  useEffect(() => {
    setMessages([]);
  }, [placeData.place?.place_id]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !placeData.place) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/places-ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          message: messageText,
          placeContext: {
            name: placeData.place.name,
            address: placeData.place.formatted_address,
            weather: placeData.weather?.current
              ? {
                  temp: placeData.weather.current.temp,
                  condition: placeData.weather.current.condition,
                  humidity: placeData.weather.current.humidity,
                }
              : undefined,
            aqi: placeData.aqi?.aqi
              ? { value: placeData.aqi.aqi, category: placeData.aqi.category }
              : undefined,
            attractions: placeData.nearbyAttractions.map((a) => a.name),
            restaurants: placeData.nearbyRestaurants.map((r) => r.name),
            hotels: placeData.nearbyHotels.map((h) => h.name),
          },
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I couldn't process your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [placeData, messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!placeData.place) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] z-50 glass-card border-l border-border flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm">Ask about {placeData.place.name}</h3>
                <p className="text-xs text-muted-foreground">AI-powered local insights</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-display font-semibold mb-2">Ask anything about this place</h4>
                  <p className="text-sm text-muted-foreground">
                    I have real-time data about weather, attractions, and local insights.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Suggested questions:</p>
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      onClick={() => sendMessage(question)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted text-sm transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[85%] ${
                        message.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === "user"
                            ? "bg-primary"
                            : "bg-gradient-to-br from-primary to-primary/60"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4 text-primary-foreground" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-primary-foreground" />
                        )}
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-[10px] opacity-60 mt-1">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted rounded-2xl px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this place..."
                disabled={isLoading}
                className="flex-1 rounded-full"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="rounded-full">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Session ends when you close. No data saved.
            </p>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
