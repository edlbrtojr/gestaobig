import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/neo4j";
import { getToken } from "next-auth/jwt";
import { Record as Neo4jRecord } from "neo4j-driver";

// Get all users in the system
export async function GET(request: Request) {
  try {
    // Authorization check
    const token = await getToken({ req: request as any });
    if (!token || !token.isSystemAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let cypher: string;
    
    switch (type) {
      case 'local':
        // Only local users
        cypher = `
          MATCH (u:_User)
          WHERE u.authType = 'local' OR u.authType IS NULL
          RETURN u
          ORDER BY u.name
        `;
        break;
        
      case 'sso':
        // Only SSO users that have logged in
        cypher = `
          MATCH (u:_User)
          WHERE u.authType = 'sso' AND u.lastLogin IS NOT NULL
          RETURN u
          ORDER BY u.name
        `;
        break;
        
      case 'all':
      default:
        // All users
        cypher = `
          MATCH (u:_User)
          RETURN u
          ORDER BY u.name
        `;
        break;
    }

    const result = await executeQuery(cypher, {});
    
    return NextResponse.json({
      success: true,
      data: result.records.map((record: Neo4jRecord) => {
        const user = record.get('u').properties;
        // Remove sensitive info
        const { password, ...safeUser } = user;
        return safeUser;
      })
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 });
  }
} 