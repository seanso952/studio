
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, UserCheck } from 'lucide-react';
import { logoutFirebaseUser } from '@/lib/authStore';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function LogoutPage() {
  const router = useRouter();

  React.useEffect(() => {
    // Attempt to log out the user automatically when they land on this page
    const performLogout = async () => {
      await logoutFirebaseUser();
      // The onAuthStateChanged listener in authStore should then redirect to /login
      // or AppShell's effect will do it.
    };
    performLogout();
  }, []);


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <UserCheck className="mx-auto h-16 w-16 text-primary" />
          <CardTitle className="text-3xl font-headline">You've Been Logged Out</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            You have been successfully signed out of your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 pt-6">
          <p className="text-sm text-foreground">
            Click below to log back in.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/login">
              <LogIn className="mr-2 h-5 w-5" />
              Login
            </Link>
          </Button>
        </CardContent>
         <CardFooter className="flex justify-center pt-6">
            <p className="text-xs text-muted-foreground">
                Thank you for using EstateMind.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
