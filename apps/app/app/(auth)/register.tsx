import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Link } from 'expo-router';
import { TRPCClientError } from '@trpc/client';
import { AuthShell } from '@/features/auth/AuthShell';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/auth';
import { deviceTimeZone } from '@/lib/dates';

export default function RegisterScreen() {
  const { register } = useAuth();
  const toast = useToast();
  const [displayName, setDisplayName] = useState('');
  const [creatureName, setCreatureName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = () => {
    void (async () => {
      setBusy(true);
      try {
        await register({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          ...(creatureName.trim() ? { creatureName: creatureName.trim() } : {}),
          timezone: deviceTimeZone(),
        });
      } catch (error) {
        toast.show(
          error instanceof TRPCClientError ? error.message : 'Could not reach the server.',
        );
      } finally {
        setBusy(false);
      }
    })();
  };

  const ready = displayName.trim() && email.trim() && password.length >= 8;

  return (
    <AuthShell title="Hatch your companion" subtitle="An egg is waiting. It needs a name — and so do you.">
      <Input label="Your name" value={displayName} onChangeText={setDisplayName} placeholder="Adam" />
      <Input
        label="Name your companion"
        value={creatureName}
        onChangeText={setCreatureName}
        placeholder="Blob"
      />
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
        autoComplete="new-password"
        placeholder="at least 8 characters"
        onSubmitEditing={submit}
      />
      <Button
        label={busy ? 'Hatching…' : 'Hatch your egg'}
        onPress={submit}
        disabled={busy || !ready}
      />
      <Link href="/login" asChild>
        <Pressable accessibilityRole="link" className="items-center py-2">
          <Text className="font-sans-bold text-sm text-violet">Already have an account? Sign in</Text>
        </Pressable>
      </Link>
    </AuthShell>
  );
}
