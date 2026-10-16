import { AuthForm } from '@/components/auth-form';
import { demoMode } from '@/lib/config';
export default function Page() {
  return <AuthForm mode="password" demo={demoMode} />;
}
