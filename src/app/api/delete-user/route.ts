import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json()
        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Delete from auth.users (cascades to profiles if FK set)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        // Also delete profile directly to be safe
        await supabaseAdmin.from('profiles').delete().eq('id', userId)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}