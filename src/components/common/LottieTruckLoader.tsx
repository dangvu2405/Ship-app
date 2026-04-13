import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useAppStore } from '@/stores/app.store';

/** Light UI (nền sáng) — animation xe tối màu. */
const LOTTIE_LIGHT_UI = '/lottie/truck-light-ui.lottie';
/** Dark UI (nền tối) — animation mặc định. */
const LOTTIE_DARK_UI = '/lottie/truck-dark-ui.lottie';

type LottieTruckLoaderProps = {
  /** Chiều rộng/ca khung animation (px). */
  size?: number;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
};

/**
 * Xe tải Lottie theo theme app: sáng dùng asset `_black`, tối dùng asset gốc.
 */
export function LottieTruckLoader({ size = 160, className, 'aria-hidden': ariaHidden = true }: LottieTruckLoaderProps) {
  const theme = useAppStore((s) => s.theme);
  const src = theme === 'dark' ? LOTTIE_DARK_UI : LOTTIE_LIGHT_UI;

  return (
    <div
      className={className}
      style={{ width: size, height: size, lineHeight: 0 }}
      aria-hidden={ariaHidden === true || ariaHidden === 'true'}
    >
      <DotLottieReact
        key={src}
        src={src}
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
