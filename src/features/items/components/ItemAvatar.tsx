import { getAvatarColor, getInitial } from '../avatar';

const SIZES = {
  md: 'size-9 text-sm',
  lg: 'size-14 text-xl',
} as const;

interface ItemAvatarProps {
  title: string;
  // The site's icon (a PNG in base64), or null to show the title's initial
  icon: string | null;
  size?: keyof typeof SIZES;
}

export function ItemAvatar({ title, icon, size = 'md' }: ItemAvatarProps) {
  if (icon) {
    return (
      <span
        aria-hidden='true'
        className={`flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white p-1.5 ${SIZES[size]}`}
      >
        {/* A PNG made by Rust from the site's icon (see the CSP's img-src) */}
        <img
          src={`data:image/png;base64,${icon}`}
          alt=''
          className='size-full object-contain'
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden='true'
      className={`flex shrink-0 items-center justify-center rounded-lg font-semibold ${SIZES[size]} ${getAvatarColor(title)}`}
    >
      {getInitial(title)}
    </span>
  );
}
