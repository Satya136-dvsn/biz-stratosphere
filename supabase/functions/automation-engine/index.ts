import { serve } from 'https-deno-land-std-0-168-0-http-server-ts'
import { createClient } from 'https-esm-sh-supabase-supabase-js-2'
import { Resend } from 'resend'
import { WebClient } from '@slack/web-api'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const slack = new WebClient(Deno.env.get('SLACK_API_KEY'))

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  const { data: rules, error } = await supabase.from('rules').select('*')

  if (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }

  for (const rule of rules) {
    // TODO: Implement the logic to check the conditions of the rule
    const conditionsMet = true;

    if (conditionsMet) {
      for (const action of rule.actions) {
        if (action.type === 'email') {
          await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: action.to,
            subject: `Alert: ${rule.name}`,
            html: `<p>This is an alert for the rule: <strong>${rule.name}</strong></p>`,
          })
        } else if (action.type === 'slack') {
          await slack.chat.postMessage({
            channel: action.channel,
            text: `Alert: ${rule.name}`,
          })
        }
      }
    }
  }

  return new Response(JSON.stringify({ message: 'Automation engine ran successfully' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
