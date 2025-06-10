
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, UserCheck } from 'lucide-react';

export default function LogoutPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <UserCheck className="mx-auto h-16 w-16 text-primary" />
          <CardTitle className="text-3xl font-headline">You've Been Logged Out</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            This is a simulated logout for testing purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 pt-6">
          <p className="text-sm text-foreground">
            You can now proceed to log back in as an administrator.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/dashboard">
              <LogIn className="mr-2 h-5 w-5" />
              Login as Admin
            </Link>
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center pt-6">
            <p className="text-xs text-muted-foreground">
                Or you can <Link href="/portal/dashboard" className="underline hover:text-primary">return to Tenant Portal</Link>.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
