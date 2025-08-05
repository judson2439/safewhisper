import { useState } from "react";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  currentUserId: string;
  onReactionUpdate: () => void;
}

const QUICK_REACTIONS = ["👍", "👎", "❤️", "😂", "😮", "😢", "‼️", "⁇⁇"];

export function MessageReactions({ 
  messageId, 
  reactions = [], 
  currentUserId, 
  onReactionUpdate 
}: MessageReactionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  const addReaction = async (emoji: string) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      console.log("Adding reaction:", emoji, "to message:", messageId);
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ emoji }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Failed to add reaction:", response.status, errorData);
        throw new Error(`Failed to add reaction: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Reaction added successfully:", result);
      onReactionUpdate();
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeReaction = async (emoji: string) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Failed to remove reaction");
      onReactionUpdate();
    } catch (error) {
      console.error("Error removing reaction:", error);
      toast({
        title: "Error",
        description: "Failed to remove reaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReaction = async (emoji: string) => {
    const userReaction = groupedReactions[emoji]?.find(r => r.userId === currentUserId);
    if (userReaction) {
      await removeReaction(emoji);
    } else {
      await addReaction(emoji);
    }
  };

  const handleQuickReaction = async (emoji: string) => {
    await toggleReaction(emoji);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {/* Existing reactions */}
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const userHasReacted = reactionList.some(r => r.userId === currentUserId);
        const reactionCount = reactionList.length;
        const usernames = reactionList.map(r => r.user.username || r.user.firstName || "Unknown").slice(0, 5);
        const tooltipText = reactionCount > 5 
          ? `${usernames.slice(0, 3).join(", ")} and ${reactionCount - 3} others`
          : usernames.join(", ");

        return (
          <TooltipProvider key={emoji}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleReaction(emoji)}
                  disabled={isLoading}
                  className={cn(
                    "h-6 px-2 py-0 text-xs rounded-full",
                    userHasReacted 
                      ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200" 
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <span className="mr-1">{emoji}</span>
                  <span>{reactionCount}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}

      {/* Add reaction popover - More visible button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 py-1 text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 shadow-sm"
            disabled={isLoading}
            title="Click to add emoji reaction"
          >
            <Smile className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Add Reaction</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3 bg-white dark:bg-gray-800 border shadow-lg" align="start">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Choose a reaction:</div>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_REACTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => handleQuickReaction(emoji)}
                disabled={isLoading}
                className="h-10 w-10 p-0 hover:bg-blue-100 dark:hover:bg-blue-900 text-2xl rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600"
                title={`React with ${emoji}`}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}