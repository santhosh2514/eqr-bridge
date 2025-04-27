import { supabase } from '@/lib/supabaseClient'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const { randomLink } = params
  console.log('randomLink:', randomLink)

  if (!randomLink) {
    return new NextResponse('Missing randomLink', { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('mappings')
      .select('website_link')
      .eq('random_link', randomLink)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return new NextResponse('Database error', { status: 500 })
    }

    if (!data) {
      console.log('No mapping found for randomLink:', randomLink)
      return new NextResponse('Not found', { status: 404 })
    }

    const websiteLink = data.website_link
    console.log('Redirecting to:', websiteLink)

    return NextResponse.redirect(websiteLink, 302)
  } catch (error) {
    console.error('Server error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}