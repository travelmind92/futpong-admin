import { normalizeExercise2 } from '../dynamo/normalize';
import { exercise2ToDynamoItem } from '../dynamo/serialize';
import type { Exercise_V3 } from '../../types/types';

export type ExerciseV3SaveMedia = {
  video?: File;
  image?: File;
};

export type SaveExerciseV3Input = {
  exercise: Exercise_V3;
  media?: ExerciseV3SaveMedia;
};

function appendFormDataValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined) {
    return;
  }
  if (Array.isArray(value)) {
    formData.append(key, JSON.stringify(value));
    return;
  }
  formData.append(key, String(value));
}

export function buildExerciseV3FormData({
  exercise,
  media,
}: SaveExerciseV3Input): FormData {
  const item = exercise2ToDynamoItem(exercise);
  const formData = new FormData();

  for (const [key, value] of Object.entries(item)) {
    if (key === 'videoUrl' && media?.video) {
      continue;
    }
    if (key === 'imageUrl' && media?.image) {
      continue;
    }
    appendFormDataValue(formData, key, value);
  }

  if (media?.video) {
    formData.append('video', media.video);
  }
  if (media?.image) {
    formData.append('image', media.image);
  }

  return formData;
}

export function parseSavedExerciseV3Body(body: unknown): Exercise_V3 | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as Record<string, unknown>;
  const candidate = record.data ?? record.exercise ?? body;
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  return normalizeExercise2(candidate as Record<string, unknown>);
}
