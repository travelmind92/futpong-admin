import { normalizeExercise } from '../dynamo/normalize';
import type { Exercise } from '../../types';

export type ExerciseSaveMedia = {
  video?: File;
  image?: File;
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

  const imageUrl = exercise.imageUrl?.trim();
  if (imageUrl && !media?.image) {
    formData.append('imageUrl', imageUrl);
  }

  if (media?.video) {
    formData.append('video', media.video);
  }
  if (media?.image) {
    formData.append('image', media.image);
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
