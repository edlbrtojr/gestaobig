"use client";

import * as React from "react";
import { useAuth, User } from "@/contexts/auth-context";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, ShieldAlert, ShieldQuestion, User as UserIcon, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function UserSwitcher() {
  const { currentUser, availableTestUsers, switchUser } = useAuth();

  if (!currentUser) {
    return null;
  }

  // Get appropriate icon based on user role
  const getUserRoleIcon = (user: User) => {
    const primaryRole = user.roles[0];
    
    switch (primaryRole) {
      case 'admin':
        return <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />;
      case 'editor':
        return <ShieldAlert className="mr-2 h-4 w-4 text-amber-500" />;
      case 'reader':
      case 'publisher':
        return <ShieldQuestion className="mr-2 h-4 w-4 text-blue-500" />;
      default:
        return <UserIcon className="mr-2 h-4 w-4 text-gray-500" />;
    }
  };

  // Get appropriate color for avatar based on role
  const getAvatarColor = (user: User) => {
    const primaryRole = user.roles[0];
    
    switch (primaryRole) {
      case 'admin': return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'editor': return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case 'reader': return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case 'publisher': return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Generate avatar initials from display name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-8 overflow-hidden rounded-full flex items-center gap-2"
        >
          <Avatar className={cn("h-7 w-7", getAvatarColor(currentUser))}>
            <AvatarFallback>{getInitials(currentUser.displayName)}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block text-xs font-medium">
            {currentUser.displayName}
          </span>
          <Badge variant="outline" className="hidden md:flex text-[10px] h-4 px-1">
            {currentUser.roles[0].toUpperCase()}
          </Badge>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <p className="text-sm font-medium">Switch Test User</p>
            <p className="text-xs text-muted-foreground">Testing different privilege levels</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availableTestUsers.map((user) => (
          <DropdownMenuItem 
            key={user.username}
            className={cn(
              "cursor-pointer flex items-center justify-between",
              currentUser.username === user.username && "bg-accent"
            )}
            onClick={() => switchUser(user)}
          >
            <div className="flex items-center">
              {getUserRoleIcon(user)}
              <span>{user.displayName}</span>
            </div>
            <Badge variant="outline" className="text-[10px] h-4 px-1">
              {user.roles[0].toUpperCase()}
            </Badge>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs text-muted-foreground">
          <Users className="mr-2 h-3 w-3" />
          <span>Create users with <code>scripts/create-test-users.js</code></span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 