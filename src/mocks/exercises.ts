import { Exercise, RepType } from '../types';

const longDescription =
  'Progressive overload pattern: start light, add resistance each set while maintaining strict form and full range of motion throughout the movement.';

export const MOCK_EXERCISES: Exercise[] = Array.from({ length: 25 }, (_, i) => {
  const n = i + 1;
  const hasVideo = n % 3 !== 0;
  return {
    id: `exercise-${n}`,
    name: `Exercise ${n}`,
    repType: n % 2 === 0 ? RepType.REPETITIONS : RepType.SECONDS,
    videoUrl: hasVideo ? `https://example.com/videos/exercise-${n}` : '',
    description:
      n % 5 === 0
        ? longDescription
        : `Short description for exercise ${n}.`,
  };
});
