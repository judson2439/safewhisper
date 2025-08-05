import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Shield, Search } from "lucide-react";

export default function TestUserDemo() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Toaster />
      
      {/* Left Sidebar - Exact ModeratorDemo copy */}
      <div className="w-64 bg-slate-800 flex flex-col">
        {/* Workspace Header */}
        <div className="h-12 bg-slate-900 flex items-center px-3 border-b border-slate-600">
          <div className="flex items-center space-x-2 flex-1">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">
              Test User Interface
            </span>
          </div>
        </div>

        {/* Search and Jump to */}
        <div className="px-3 py-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-slate-300 hover:bg-slate-700 hover:text-white text-xs h-7"
          >
            <Search className="w-3 h-3 mr-2" />
            Jump to...
          </Button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-3">
          <div className="py-2 text-white">
            <p>Test sidebar content</p>
            <p>This should extend to full height</p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="h-12 bg-slate-900 border-t border-slate-600 flex items-center px-3">
          <span className="text-white text-xs">Bottom section</span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Test User Interface</h1>
            <p className="text-gray-600">Testing sidebar height fix</p>
          </div>
        </div>
      </div>
    </div>
  );
}