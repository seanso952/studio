
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, UserCheck } from 'lucide-react';
import { logoutFirebaseUser } from '@/lib/authStore';

export default function LogoutPage() {

  React.useEffect(() => {
    logoutFirebaseUser();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <UserCheck className="mx-auto h-16 w-16 text-primary" />
          <CardTitle className="text-3xl font-headline">You've Been Logged Out</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            You have been successfully signed out.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 pt-6">
          <p className="text-sm text-foreground">
            Click below to log back in. Your login page should appear automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
