import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const SUPER_ADMIN_EMAIL = 'ibo.tezcan42@gmail.com'

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json()
        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Verify the caller is the super admin
        const authHeader = req.headers.get('Authorization')
        const token = authHeader?.replace('Bearer ', '')
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token)
        if (caller?.email !== SUPER_ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Bu islemi sadece super admin yapabilir.' }, { status: 403 })
        }

        // Verified - proceed with deletion
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        await supabaseAdmin.from('profiles').delete().eq('id', userId)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}