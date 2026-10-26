import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/Button';
import { useClipboardStore } from './clipboardStore';

// A status bar at the bottom of the window while a copy waits to be wiped,
// like KeePassXC's: how long is left, and a way to wipe it now
export function ClipboardStatusBar() {
  const countdown = useClipboardStore((state) => state.countdown);
  const clearNow = useClipboardStore((state) => state.clearNow);

  if (!countdown) {
    return null;
  }

  // Rounded up: it never says 0 while there is time left
  const seconds = Math.ceil(countdown.remainingMs / 1000);
  const left = countdown.remainingMs / countdown.totalMs;

  return (
    <div className='border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950'>
      <div className='flex items-center gap-3 px-4 py-1.5 text-sm text-zinc-700 dark:text-zinc-300'>
        <ClipboardCheck className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />
        {/* A timer can be read at any time, but isn't announced every second */}
        <p role='timer' className='flex-1'>
          Copied · clears in {seconds} s
        </p>
        <Button onClick={() => void clearNow()}>Clear now</Button>
      </div>
      {/* The same as the text above, as a bar that shrinks */}
      <div aria-hidden='true' className='h-1 bg-zinc-200 dark:bg-zinc-800'>
        <div
          className='h-full origin-left bg-emerald-500 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-linear'
          style={{ transform: `scaleX(${left})` }}
        />
      </div>
    </div>
  );
}
