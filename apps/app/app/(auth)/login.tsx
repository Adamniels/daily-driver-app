import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Link } from 'expo-router';
import { TRPCClientError } from '@trpc/client';
import { AuthShell } from '@/features/auth/AuthShell';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = () => {
    void (async () => {
      setBusy(true);
      try {
        await login(email.trim(), password);
      } catch (error) {
        toast.show(
          error instanceof TRPCClientError ? error.message : 'Could not reach the server.',
        );
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <AuthShell title="Welcome back" subtitle="Your companion missed you.">
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        placeholder="••••••••"
        onSubmitEditing={submit}
      />
      <Button label={busy ? 'Signing in…' : 'Sign in'} onPress={submit} disabled={busy || !email || !password} />
      <Link href="/register" asChild>
        <Pressable accessibilityRole="link" className="items-center py-2">
          <Text className="font-sans-bold text-sm text-violet">
            First time here? Hatch your companion →
          </Text>
        </Pressable>
      </Link>
    </AuthShell>
  );
}
