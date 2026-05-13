import { redirect } from 'next/navigation'

export default function Home() {
  // Este redirect é um fallback - o middleware já deve ter redirecionado
  redirect('/auth/login')
}
