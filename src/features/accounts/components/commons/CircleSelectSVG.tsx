import colors from '@/themes/colors';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface CircleSelectedSVGProps extends SvgProps {
    circleColor?: string;
    strokeWidthValue?: number;
}

export default function CircleSelectedSVG(props: CircleSelectedSVGProps) {
    const {
        circleColor = colors['system-blue'],
        strokeWidthValue = 0.35,
        ...rest
    } = props;

    return (
        <Svg viewBox='0 0 140 132' {...rest}>
            <Path
                d='M63.3 19.1c-8.4 1.1-19.5 7-26.4 13.8A47.1 47.1 0 0 0 71 113.4c56.7-.3 64.2-84.2 8-89.1-6.7-.7-7.5-1-7.8-2.9-.4-2.8-1.5-3-8-2.2m.8 5.3a32 32 0 0 1-6.2 3.5c-8 3.7-11.6 7.4-9.8 9.5q2.4 3.2 5.6-.6c12-13.5 44.9-7.4 54.2 10.2 18.7 35.3-20.2 74.2-56.5 56.4-32.8-16-27.7-68.5 7.6-78l4.9-1.4z'
                stroke={circleColor}
                strokeWidth={strokeWidthValue}
                fill={circleColor}
            />
        </Svg>
    );
}

// d="M154.5 21.5c-44.2 4.7-94.2 19-106.2 30.5-5.9 5.6-4.1 6.5 4.5 2.2 8-4 24.9-10.5 26.3-10 .6.2-2.1 3.1-6.1 6.6C55.6 66 42.9 88.9 35.6 118.5c-25.5 103.6 60 205.4 140.2 166.9C241.7 253.7 292.7 159 278.2 95c-13-57-53.3-81-123.7-73.5m38.4 7.6c95.5 9.8 105.8 129.4 18.5 216.4q-74.4 74.1-138.1 3.2C36.3 207.3 29.1 137.5 56.5 83 68 60 86.4 43.4 102 41.6l4.8-.5q.4-.3-.8-1.6c-1.8-2.1-2.4-1.9 14.5-4.8 21.4-3.7 29-4.7 42.8-5.6 18.1-1.2 18.6-1.2 29.6 0"
