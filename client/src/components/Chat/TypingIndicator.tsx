import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface TypingIndicatorProps {
  user: User;
}

export default function TypingIndicator({ user }: TypingIndicatorProps) {
  return (
    <div className="flex items-start space-x-3">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={user.profileImageUrl} />
        <AvatarFallback>
          {user.username?.[0] || user.firstName?.[0] || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="bg-gray-100 rounded-lg rounded-tl-none p-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  );
}
