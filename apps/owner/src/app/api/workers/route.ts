import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, name, password } = await request.json();
    
    // Obter token do header Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Criar cliente Supabase com o token do usuário
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // 1. Verify current user is owner
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    console.log('API Workers - Auth result:', { userId: user?.id, authError: authError?.message });
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    const { data: membersData, error: membersError } = await supabase
      .from('tenant_members')
      .select('role, tenant_id')
      .eq('user_id', user.id)
      .limit(1);

    if (membersError) {
      console.error('Error fetching tenant members:', membersError);
    }

    const memberData = membersData?.[0];

    if (!memberData || memberData.role !== 'owner') {
      console.error('Worker creation failed: User is not owner or no membership found', { 
        userId: user.id, 
        memberData, 
        membersData,
        membersError
      });
      return NextResponse.json({ error: 'Forbidden: Not an owner', details: { memberData, userId: user.id, error: membersError } }, { status: 403 });
    }

    const tenantId = memberData.tenant_id;

    // 2. Create user with Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        account_type: 'worker'
      }
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!newUser.user) {
       return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // 3. Clean up auto-created tenant (if any) and assign to current tenant
    // Wait a bit for trigger to run? Triggers are synchronous usually.
    
    // Find the auto-created membership
    const { data: autoMemberships } = await supabaseAdmin
      .from('tenant_members')
      .select('id, tenant_id')
      .eq('user_id', newUser.user.id);

    if (autoMemberships && autoMemberships.length > 0) {
      // Delete these memberships
      const idsToDelete = autoMemberships.map(m => m.id);
      await supabaseAdmin
        .from('tenant_members')
        .delete()
        .in('id', idsToDelete);
        
      // Optionally delete the tenants if they were just created and have no other members
      // This is complex, let's just remove the membership for now to avoid the "multiple tenants" issue.
    }

    // 4. Add to correct tenant as worker
    const { error: memberError } = await supabaseAdmin
      .from('tenant_members')
      .insert({
        tenant_id: tenantId,
        user_id: newUser.user.id,
        role: 'worker'
      });

    if (memberError) {
       // Rollback user creation if possible, or just return error
       await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
       return NextResponse.json({ error: memberError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, user: newUser.user });

  } catch (error: any) {
    console.error('Error creating worker:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();
    
    // Obter token do header Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Criar cliente Supabase com o token do usuário
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // 1. Verify current user is owner
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membersData } = await supabase
      .from('tenant_members')
      .select('role, tenant_id')
      .eq('user_id', user.id)
      .limit(1);

    const memberData = membersData?.[0];

    if (!memberData || memberData.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = memberData.tenant_id;

    // 2. Verify the target user belongs to this tenant and is a worker
    const { data: targetMember } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (!targetMember) {
        return NextResponse.json({ error: 'User not found in this tenant' }, { status: 404 });
    }

    // Only workers can be removed through this endpoint. Prevents an owner
    // from deleting other owners/solos/superadmins of the same tenant.
    if (targetMember.role !== 'worker') {
        return NextResponse.json({ error: 'Forbidden: target is not a worker' }, { status: 403 });
    }

    // 3. Delete user using Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Remove from tenant first (cascade should handle it if we delete user, but let's be explicit)
    await supabaseAdmin
        .from('tenant_members')
        .delete()
        .eq('user_id', userId)
        .eq('tenant_id', tenantId);

    // Delete the user account
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting worker:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
