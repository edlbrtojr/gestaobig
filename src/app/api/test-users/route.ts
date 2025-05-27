import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/neo4j";
import { Record } from "neo4j-driver";

export async function GET() {
  try {
    // Query Neo4j for users with the User label
    const result = await executeQuery(`
      MATCH (u:User)
      RETURN u.username AS username, 
             u.displayName AS displayName, 
             u.description AS description,
             u.roles AS roles
    `);

    // If no results or error, return default users
    if (!result || !result.records || result.records.length === 0) {
      return NextResponse.json({
        users: [
          {
            username: 'admin_user',
            displayName: 'Administrator',
            description: 'Full admin privileges with read/write access to all data',
            roles: ['admin']
          },
          {
            username: 'editor_user',
            displayName: 'Editor',
            description: 'Can create and modify data but cannot manage users',
            roles: ['editor']
          },
          {
            username: 'analyst_user',
            displayName: 'Analyst',
            description: 'Can read all data and publish specific reports',
            roles: ['reader', 'publisher']
          },
          {
            username: 'reader_user',
            displayName: 'Reader',
            description: 'Read-only access to all data',
            roles: ['reader']
          },
          {
            username: 'limited_user',
            displayName: 'Limited Access',
            description: 'Very limited access to specific data only',
            roles: ['limited']
          }
        ]
      });
    }

    // Format the response
    const users = result.records.map((record: Record) => ({
      username: record.get('username'),
      displayName: record.get('displayName'),
      description: record.get('description'),
      roles: record.get('roles')
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching test users:', error);
    
    // Return a fallback response with default users on error
    return NextResponse.json(
      {
        error: 'Failed to fetch test users',
        users: [
          {
            username: 'admin_user',
            displayName: 'Administrator',
            description: 'Full admin privileges with read/write access to all data',
            roles: ['admin']
          },
          {
            username: 'editor_user',
            displayName: 'Editor',
            description: 'Can create and modify data but cannot manage users',
            roles: ['editor']
          },
          {
            username: 'analyst_user',
            displayName: 'Analyst',
            description: 'Can read all data and publish specific reports',
            roles: ['reader', 'publisher']
          },
          {
            username: 'reader_user',
            displayName: 'Reader',
            description: 'Read-only access to all data',
            roles: ['reader']
          },
          {
            username: 'limited_user',
            displayName: 'Limited Access',
            description: 'Very limited access to specific data only',
            roles: ['limited']
          }
        ]
      },
      { status: 500 }
    );
  }
} 