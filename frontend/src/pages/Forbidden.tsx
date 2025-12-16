import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card';

/**
 * Forbidden - 403 Error Page
 * 
 * Displayed when user tries to access a resource they don't have permission for.
 * Can be used for role-based access control in the future.
 */
export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">Access denied</CardTitle>
          <CardDescription>
            You don't have permission to access this resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Error code: <span className="font-mono font-semibold">403</span>
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Go to home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
