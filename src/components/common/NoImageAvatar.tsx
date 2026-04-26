import { Avatar } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import type { AvatarProps } from 'antd';

interface NoImageAvatarProps extends Omit<AvatarProps, 'src' | 'children'> {
  src?: string | null;
}

export function NoImageAvatar({ src, size = 64, shape = 'square', ...rest }: NoImageAvatarProps) {
  const trimmed = src?.trim();
  if (trimmed) {
    return <Avatar src={trimmed} alt="" shape={shape} size={size} {...rest} />;
  }
  return (
    <Avatar shape={shape} size={size} className="shrink-0 bg-muted text-muted-foreground" {...rest}>
      <PictureOutlined style={{ fontSize: typeof size === 'number' ? size * 0.4 : 20, opacity: 0.45 }} aria-hidden />
    </Avatar>
  );
}
