import { PageContainer } from '@/components/ui/page-container';
import { SettingsSkeleton } from '@/components/skeletons/SettingsSkeleton';

export default function Loading() {
  return (
    <PageContainer className="max-w-[560px]">
      <SettingsSkeleton />
    </PageContainer>
  );
}
