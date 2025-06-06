import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import neo4j from 'neo4j-driver';
import { z } from 'zod';

// Schema de validação
const registerSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
});

export async function POST(request: NextRequest) {
  try {
    // Obter e validar os dados
    const body = await request.json();
    console.log("Tentando registrar usuário:", { email: body.email, name: body.name });
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      console.log("Validação falhou:", validation.error.errors);
      return NextResponse.json({
        success: false,
        errors: validation.error.errors
      }, { status: 400 });
    }
    
    const { name, email, password } = validation.data;
    
    // Conectar ao Neo4j
    const driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || ''
      ),
      {
        disableLosslessIntegers: true
      }
    );
    
    const session = driver.session();
    
    try {
      // Verificar se o usuário já existe
      const checkResult = await session.run(
        `MATCH (u:_User {email: $email}) RETURN u`,
        { email }
      );
      
      if (checkResult.records.length > 0) {
        console.log("Usuário já existe:", email);
        return NextResponse.json({
          success: false,
          error: 'Usuário já existe com este email'
        }, { status: 409 }); // Conflict
      }
      
      // Criptografar senha
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("Senha criptografada gerada");
      
      // Criar novo usuário
      console.log("Criando usuário no Neo4j:", { name, email });
      const result = await session.run(
        `CREATE (u:_User {
          id: randomUUID(),
          name: $name,
          email: $email,
          password: $password,
          authType: 'local',
          active: true,
          isSystemAdmin: false,
          createdAt: datetime()
        }) RETURN u`,
        {
          name,
          email,
          password: hashedPassword
        }
      );
      
      // Verificar se o usuário foi criado
      const createdUser = result.records[0]?.get('u').properties;
      
      if (!createdUser) {
        console.log("Falha ao criar usuário no Neo4j");
        return NextResponse.json({
          success: false,
          error: 'Falha ao criar usuário'
        }, { status: 500 });
      }
      
      console.log("Usuário criado com sucesso:", { email: createdUser.email, id: createdUser.id });
      
      // Remover senha antes de retornar
      const { password: _, ...userWithoutPassword } = createdUser;
      
      return NextResponse.json({
        success: true,
        user: userWithoutPassword
      }, { status: 201 });
      
    } catch (error: any) {
      console.error('Erro ao registrar usuário:', error);
      
      return NextResponse.json({
        success: false,
        error: error.message || 'Falha ao processar solicitação'
      }, { status: 500 });
    } finally {
      await session.close();
      await driver.close();
    }
  } catch (error: any) {
    console.error('Erro de servidor:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
} 