
import { redirect } from 'next/navigation';
// Removed auth check here, will be handled by AppShell or individual layouts
// For the root page, we will redirect to /dashboard by default, 
// and AppShell/login logic will intercept if not authenticated.

export default function HomePage() {
  redirect('/dashboard');
  // The AppShell or relevant layout will handle redirection to /login if not authenticated.
  return null; 
}
