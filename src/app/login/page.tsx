
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Landmark, LogIn, Loader2, AlertTriangle } from 'lucide-react';
import { auth } from '@/lib/firebaseConfig'; // Import auth from firebaseConfig
import { signInWithEmailAndPassword } from 'firebase/auth';

const loginFormSchema = z.object({
  email: z.string().email("Invalid email address.").min(1, "Email is required."),
  password: z.string().min(6, "Password must be at least 6 characters.").min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [firebaseError, setFirebaseError] = React.useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    setFirebaseError(null);

    if (!auth) {
      const authUnavailableError = "Authentication service is not available. Please check Firebase configuration (e.g., API key).";
      setFirebaseError(authUnavailableError);
      toast({ variant: "destructive", title: "Login Failed", description: authUnavailableError });
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      // onAuthStateChanged in authStore will handle user state update
      // Redirect based on role will be handled by AppShell or dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Firebase login error:", error);
      let errorMessage = "Failed to login. Please check your credentials.";
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = "Invalid email or password. Please ensure the account exists and credentials are correct.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Please enter a valid email address.";
            break;
          case 'auth/user-disabled':
            errorMessage = "This user account has been disabled.";
            break;
          default:
            errorMessage = "An unexpected error occurred during login. Please try again.";
        }
      }
      setFirebaseError(errorMessage);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <Landmark className="mx-auto h-16 w-16 text-primary" />
          <CardTitle className="text-3xl font-headline">EstateMind Login</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Access your property management dashboard.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {firebaseError && (
                <div className="bg-destructive/10 p-3 rounded-md flex items-center text-sm text-destructive border border-destructive/30">
                  <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {firebaseError}
                </div>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>
              <div className="text-sm text-center w-full">
                <Link href="#" className="font-medium text-primary hover:underline">
                  Forgot your password?
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
         <div className="p-6 pt-2 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="#" className="font-medium text-primary hover:underline">
                Sign Up
            </Link>
            <p className="text-xs text-muted-foreground mt-4">
                Example accounts (e.g., admin@example.com, manager@example.com, alice@example.com with password &quot;password&quot;)
                must be created in your Firebase Authentication console before you can use them to log in.
            </p>
        </div>
      </Card>
    </div>
  );
}
