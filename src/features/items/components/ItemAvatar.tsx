import { getAvatarColor, getInitial } from '../avatar';

const SIZES = {
  md: 'size-9 text-sm',
  lg: 'size-14 text-xl',
} as const;

interface ItemAvatarProps {
  title: string;
  size?: keyof typeof SIZES;
}

export function ItemAvatar({ title, size = 'md' }: ItemAvatarProps) {
  return (
    <span
      aria-hidden='true'
      className={`flex shrink-0 items-center justify-center rounded-lg font-semibold ${SIZES[size]} ${getAvatarColor(title)}`}
    >
      {getInitial(title)}
    </span>
  );
}
