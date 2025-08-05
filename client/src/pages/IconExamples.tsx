import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  // Current options
  User, Users,
  // Geometric/Simple
  Circle, Square, Minus, Hash,
  // Message/Chat themed
  MessageSquare, MessageCircle, Mail,
  // Folder/Organization
  Folder, FolderOpen, Archive,
  // Navigation/Action
  ChevronDown, ChevronRight, MoreHorizontal,
  // Fun/Creative
  Sparkles, Star, Zap, Heart,
  // Professional
  Building, Shield, Lock,
  // No icon option
  ArrowRight
} from "lucide-react";

export default function IconExamples() {
  const iconCategories = [
    {
      name: "Current Implementation",
      description: "What we just applied",
      icons: [
        { component: User, name: "User", desc: "For Private Skrams" },
        { component: Users, name: "Users", desc: "For Group Skrams" },
      ]
    },
    {
      name: "Geometric & Minimal",
      description: "Clean, simple shapes",
      icons: [
        { component: Circle, name: "Circle", desc: "Simple dot" },
        { component: Square, name: "Square", desc: "Simple square" },
        { component: Minus, name: "Minus", desc: "Horizontal line" },
        { component: Hash, name: "Hash", desc: "# symbol (like Discord)" },
      ]
    },
    {
      name: "Message & Chat Themed",
      description: "Icons that represent communication",
      icons: [
        { component: MessageSquare, name: "MessageSquare", desc: "Speech bubble" },
        { component: MessageCircle, name: "MessageCircle", desc: "Round bubble" },
        { component: Mail, name: "Mail", desc: "Email icon" },
      ]
    },
    {
      name: "Folder & Organization",
      description: "File system inspired",
      icons: [
        { component: Folder, name: "Folder", desc: "Closed folder" },
        { component: FolderOpen, name: "FolderOpen", desc: "Open folder" },
        { component: Archive, name: "Archive", desc: "Archive box" },
      ]
    },
    {
      name: "Navigation & Arrows",
      description: "Directional indicators",
      icons: [
        { component: ChevronDown, name: "ChevronDown", desc: "Down arrow (you didn't like)" },
        { component: ChevronRight, name: "ChevronRight", desc: "Right arrow" },
        { component: MoreHorizontal, name: "MoreHorizontal", desc: "Three dots" },
      ]
    },
    {
      name: "Fun & Creative",
      description: "More playful options",
      icons: [
        { component: Sparkles, name: "Sparkles", desc: "Magical feel" },
        { component: Star, name: "Star", desc: "Favorite/important" },
        { component: Zap, name: "Zap", desc: "Energy/quick" },
        { component: Heart, name: "Heart", desc: "Friendly/warm" },
      ]
    },
    {
      name: "Professional & Security",
      description: "Business-focused icons",
      icons: [
        { component: Building, name: "Building", desc: "Company/workspace" },
        { component: Shield, name: "Shield", desc: "Security" },
        { component: Lock, name: "Lock", desc: "Privacy" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Icon Options for Section Headers
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Choose your preferred icon style for "Private Skrams" and "Group Skrams" sections
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {iconCategories.map((category) => (
            <Card key={category.name} className="w-full">
              <CardHeader>
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {category.icons.map((icon) => {
                    const IconComponent = icon.component;
                    return (
                      <div key={icon.name} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <IconComponent className="w-4 h-4 text-slate-300" />
                          <div>
                            <span className="text-slate-300 font-medium text-sm">{icon.name}</span>
                            <p className="text-slate-400 text-xs">{icon.desc}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs"
                            onClick={() => console.log(`Selected ${icon.name} for Private Skrams`)}
                          >
                            Use for Private
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs"
                            onClick={() => console.log(`Selected ${icon.name} for Group Skrams`)}
                          >
                            Use for Groups
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>No Icon Option</CardTitle>
            <CardDescription>Remove icons completely for a cleaner text-only look</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-slate-300 font-medium text-sm">Private Skrams</span>
                  <span className="text-slate-400 text-xs">(No icon, just text)</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs"
                  onClick={() => console.log('Selected no icons')}
                >
                  Use Text Only
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Current Preview (Lightning Bolt icons)
          </h3>
          <div className="space-y-2">
            <div className="flex items-center text-slate-300 text-xs font-medium">
              <Zap className="w-3 h-3 mr-1" />
              Private Skrams
            </div>
            <div className="flex items-center text-slate-300 text-xs font-medium">
              <div className="flex mr-1">
                <Zap className="w-3 h-3" />
                <Zap className="w-3 h-3 -ml-1" />
              </div>
              Group Skrams
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}