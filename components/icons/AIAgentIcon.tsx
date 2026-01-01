import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';

import { aiAssistant } from '@/src/theme/tokens';

type AIAgentIconProps = {
  size?: number;
};

export function AIAgentIcon({ size = 20 }: AIAgentIconProps) {
  // Use a unique ID to avoid conflicts with other SVG gradients
  const gradientId = 'aiAgentGoldSparkle';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop stopColor={aiAssistant.sparkleGradient.from} />
          <Stop offset="1" stopColor={aiAssistant.sparkleGradient.to} />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M12 2L14.09 8.26L20.18 8.27L15.54 12.14L17.27 18.18L12 14.77L6.73 18.18L8.46 12.14L3.82 8.27L9.91 8.26L12 2Z"
        fill={`url(#${gradientId})`}
      />
      <Circle cx="19" cy="5" r="1.5" fill={`url(#${gradientId})`} />
      <Circle cx="5" cy="19" r="1" fill={`url(#${gradientId})`} />
      <Circle cx="20" cy="17" r="1" fill={`url(#${gradientId})`} />
    </Svg>
  );
}
