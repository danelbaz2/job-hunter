import Link from 'next/link';
import { Compass } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <PageContainer>
      <EmptyState
        icon={<Compass size={20} />}
        title="This page doesn't exist"
        description="The link may be old, or the page may have moved."
        action={
          <Button asChild variant="secondary">
            <Link href="/search">Back to search</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
