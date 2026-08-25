import { PageContainer } from '@/components/ui/page-container';
import { ResultsGridSkeleton } from '@/components/skeletons/ResultsGridSkeleton';

export default function Loading() {
  return (
    <PageContainer wide>
      <ResultsGridSkeleton />
    </PageContainer>
  );
}
