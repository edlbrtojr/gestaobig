"use client";

import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldQuestion, 
  User, 
  CheckCircle2, 
  XCircle,
  Settings,
  FileEdit,
  Eye,
  Send,
  Lock
} from "lucide-react";

// Define the permissions we want to check for each role
const permissionsList = [
  { 
    id: 'createUser', 
    name: 'Create Users', 
    description: 'Ability to create new user accounts',
    icon: <User className="h-4 w-4" />,
    roles: ['admin']
  },
  { 
    id: 'manageSettings', 
    name: 'Manage Settings', 
    description: 'Ability to change system settings',
    icon: <Settings className="h-4 w-4" />,
    roles: ['admin']
  },
  { 
    id: 'editData', 
    name: 'Edit Data', 
    description: 'Ability to modify existing data',
    icon: <FileEdit className="h-4 w-4" />,
    roles: ['admin', 'editor']
  },
  { 
    id: 'readData', 
    name: 'Read Data', 
    description: 'Ability to view all data',
    icon: <Eye className="h-4 w-4" />,
    roles: ['admin', 'editor', 'reader', 'publisher']
  },
  { 
    id: 'publishReports', 
    name: 'Publish Reports', 
    description: 'Ability to publish reports',
    icon: <Send className="h-4 w-4" />,
    roles: ['admin', 'publisher']
  },
  { 
    id: 'manageRoles', 
    name: 'Manage Roles', 
    description: 'Ability to assign roles to users',
    icon: <Lock className="h-4 w-4" />,
    roles: ['admin']
  },
];

export function UserPermissionDisplay() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null;
  }

  // Function to check if the current user has a specific permission
  const hasPermission = (permissionRoles: string[]) => {
    return currentUser.roles.some(role => permissionRoles.includes(role));
  };

  // Get appropriate icon based on user role
  const getRoleIcon = () => {
    const primaryRole = currentUser.roles[0];
    
    switch (primaryRole) {
      case 'admin':
        return <ShieldCheck className="h-6 w-6 text-green-500" />;
      case 'editor':
        return <ShieldAlert className="h-6 w-6 text-amber-500" />;
      case 'reader':
      case 'publisher':
        return <ShieldQuestion className="h-6 w-6 text-blue-500" />;
      default:
        return <User className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {getRoleIcon()}
          <div>
            <CardTitle>{currentUser.displayName}</CardTitle>
            <CardDescription>{currentUser.description}</CardDescription>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          {currentUser.roles.map(role => (
            <Badge key={role} variant="secondary">
              {role.toUpperCase()}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-sm font-medium mb-2">Permissions</h3>
        <ul className="space-y-2">
          {permissionsList.map(permission => {
            const permitted = hasPermission(permission.roles);
            
            return (
              <li key={permission.id} className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6">
                  {permitted 
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" /> 
                    : <XCircle className="h-5 w-5 text-red-500" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="text-muted-foreground">{permission.icon}</div>
                  <span className={!permitted ? "text-muted-foreground" : ""}>
                    {permission.name}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-4 text-xs text-muted-foreground bg-muted p-2 rounded">
          <p>Testing user privileges with Neo4j authentication roles</p>
          <p>Username: <code>{currentUser.username}</code></p>
        </div>
      </CardContent>
    </Card>
  );
} 