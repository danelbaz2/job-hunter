import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SignOutButton } from './SignOutButton';
import { PageContainer } from '@/components/ui/page-container';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FadeIn } from '@/components/motion/FadeIn';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/');

  return (
    <PageContainer>
      <FadeIn>
        <h1 className="mb-6 text-2xl">Settings</h1>

        <Card className="mb-6 gap-0 p-4">
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-text/60">Name</span>
            <span>{session.user.name ?? '—'}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2 text-sm">
            <span className="text-text/60">Email</span>
            <span>{session.user.email}</span>
          </div>
        </Card>

        <SignOutButton />
      </FadeIn>
    </PageContainer>
  );
}
