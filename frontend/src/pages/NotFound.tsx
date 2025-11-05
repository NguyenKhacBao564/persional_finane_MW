import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card';

/**
 * NotFound - 404 Error Page
 * 
 * Displayed when user navigates to a route that doesn't exist.
 * Provides navigation back to home/login.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">Page not found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Error code: <span className="font-mono font-semibold">404</span>
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Go to home
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
