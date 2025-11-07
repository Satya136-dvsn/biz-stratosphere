import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function HomePage() {
  const cookieStore = cookies()
  const session = cookieStore.get('sb-access-token')

  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }

  return null
}
