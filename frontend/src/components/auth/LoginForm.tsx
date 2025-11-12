import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/ui/form';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { login } from '@/api/auth';
import { setTokens } from '@/lib/tokens';
import { extractErrorMessage } from '@/lib/errors';
import { loginSchema, type LoginValues } from '@/lib/validators/auth';
import { toast } from 'sonner';

function LoginForm() {
  const navigate = useNavigate();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: login,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      const result = await mutateAsync(values);
      setTokens(result.tokens);
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (error) {
      const message = extractErrorMessage(error);
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" autoComplete="email" placeholder="you@example.com" />
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
                <Input {...field} type="password" autoComplete="current-password" placeholder="********" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {formError ? (
          <p className="text-sm font-medium text-destructive" role="alert" aria-live="polite">
            {formError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          No account yet?{' '}
          <Link className="text-primary underline-offset-4 hover:underline" to="/register">
            Create one
          </Link>
        </p>
      </form>
    </Form>
  );
}

export default LoginForm;
