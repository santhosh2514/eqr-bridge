import { supabase } from '@/lib/supabaseClient'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    // Perform a lightweight query to keep the database active
    const { data, error } = await supabase
      .from('mappings')
      .select('id')
      .limit(1)
      .single()

    if (error) {
      console.error('Keep-alive query error:', error)
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database keep-alive successful',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Keep-alive error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 