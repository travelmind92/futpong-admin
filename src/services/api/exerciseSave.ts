import { normalizeExercise } from '../dynamo/normalize';
import type { Exercise } from '../../types';

export type ExerciseSaveMedia = {
  video?: File;
  thumbnail?: File;
};

export type SaveExerciseInput = {
  exercise: Exercise;
  media?: ExerciseSaveMedia;
};

export function buildExerciseFormData({
  exercise,
  media,
}: SaveExerciseInput): FormData {
  const formData = new FormData();
  formData.append('id', exercise.id);
  formData.append('name', exercise.name);
  formData.append('description', exercise.description);
  formData.append('repType', exercise.repType);

  const equivalenceGroup = exercise.equivalenceGroup?.trim();
  if (equivalenceGroup) {
    formData.append('equivalenceGroup', equivalenceGroup);
  }

  const videoUrl = exercise.videoUrl?.trim();
  if (videoUrl && !media?.video) {
    formData.append('videoUrl', videoUrl);
  }

  const thumbnailUrl = exercise.thumbnailUrl?.trim();
  if (thumbnailUrl && !media?.thumbnail) {
    formData.append('thumbnailUrl', thumbnailUrl);
  }

  if (media?.video) {
    formData.append('video', media.video);
  }
  if (media?.thumbnail) {
    formData.append('thumbnail', media.thumbnail);
  }

  return formData;
}

export function parseSavedExerciseBody(body: unknown): Exercise | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as Record<string, unknown>;
  const candidate = record.data ?? record.exercise ?? body;
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  return normalizeExercise(candidate as Record<string, unknown>);
}
