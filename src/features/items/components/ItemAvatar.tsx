import { getAvatarColor, getInitial } from '../avatar';

interface ItemAvatarProps {
  title: string;
}

export function ItemAvatar({ title }: ItemAvatarProps) {
  return (
    <span
      aria-hidden='true'
      className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${getAvatarColor(title)}`}
    >
      {getInitial(title)}
    </span>
  );
}
