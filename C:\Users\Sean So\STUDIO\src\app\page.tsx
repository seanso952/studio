
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
  // The AppShell or relevant layout will handle redirection to /login if not authenticated.
  return null; 
}
