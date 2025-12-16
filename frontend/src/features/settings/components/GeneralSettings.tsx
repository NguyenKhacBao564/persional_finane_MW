import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Label } from '@/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { updateUserPreferences, getUserPreferences } from '@/api/user';
import { useTheme } from '@/components/theme-provider';

export function GeneralSettings() {
  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();
  const [currency, setCurrency] = useState<string>('VND');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getUserPreferences();
        setCurrency(prefs.currency);
        // We prioritize the global theme context (which reads from local storage on boot)
        // but we could theoretically sync from backend here if needed.
        // For now, we trust the ThemeProvider's initialization.
      } catch (error) {
        console.error(error);
      } finally {
        setIsFetching(false);
      }
    };
    loadPreferences();
  }, []);

  const handleCurrencyChange = async (value: string) => {
    setCurrency(value);
    setIsLoading(true);
    try {
      await updateUserPreferences({ currency: value as 'VND' | 'USD' });
      toast.success('Currency updated');
      console.log('App update triggered: Currency changed to', value);
    } catch (error) {
      toast.error('Failed to update currency');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (value: string) => {
    const newTheme = value as 'light' | 'dark' | 'system';
    setGlobalTheme(newTheme);
    
    // Sync with "backend"
    try {
      await updateUserPreferences({ theme: newTheme });
      // No toast needed for theme as the visual feedback is instant
    } catch (error) {
      console.error('Failed to sync theme preference', error);
    }
  };

  if (isFetching) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>General Preferences</CardTitle>
                  <CardDescription>Customize your application experience.</CardDescription>
              </CardHeader>
              <CardContent className="h-[200px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Preferences</CardTitle>
        <CardDescription>Customize your application experience.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={currency} onValueChange={handleCurrencyChange} disabled={isLoading}>
            <SelectTrigger id="currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VND">Vietnamese Dong (VND)</SelectItem>
              <SelectItem value="USD">US Dollar (USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="theme">Theme</Label>
          <Select value={globalTheme} onValueChange={handleThemeChange}>
            <SelectTrigger id="theme">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
