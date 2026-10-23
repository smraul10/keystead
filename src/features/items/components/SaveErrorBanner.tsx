import { TriangleAlert } from 'lucide-react';
import { errorMessage } from '@/api';
import { Button } from '@/components/Button';
import { useItemsStore } from '../itemsStore';

// Stays at the top of the window while the last changes aren't saved: they
// are still on screen, but would be lost when the app closes
export function SaveErrorBanner() {
  const saveError = useItemsStore((state) => state.saveError);
  const retrySave = useItemsStore((state) => state.retrySave);

  if (!saveError) {
    return null;
  }

  return (
    <div className='flex items-center gap-3 border-b border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-900'>
      <TriangleAlert className='size-4 shrink-0' />
      <p role='alert' className='flex-1'>
        <span className='font-semibold'>Your changes couldn't be saved.</span>{' '}
        {errorMessage(saveError)}
      </p>
      <Button onClick={retrySave}>Try again</Button>
    </div>
  );
}
