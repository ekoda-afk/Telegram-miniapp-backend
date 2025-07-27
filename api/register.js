import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { telegram_id, username, referred_by } = req.body

  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegram_id)

  if (existing.length > 0) {
    return res.json({ message: 'User already exists', user: existing[0] })
  }

  const { data: newUser } = await supabase.from('users').insert([
    {
      telegram_id,
      username,
      referral_code: telegram_id,
      referred_by,
      points: 0
    }
  ])

  if (referred_by) {
    const { data: refUser } = await supabase
      .from('users')
      .select('points')
      .eq('telegram_id', referred_by)
      .single()

    if (refUser) {
      await supabase
        .from('users')
        .update({ points: refUser.points + 10 })
        .eq('telegram_id', referred_by)
    }
  }

  return res.json({ message: 'User registered', user: newUser })
}
