import React, {
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  EXERCISE_2_VERSION,
} from '../services/dynamo/serialize';
import {
  Age_V3,
  BlockType_V3,
  ChallengeLevel_V3,
  Difficulty_V3,
  Element_V3,
  ExerciseCategory_V3,
  Impact_V3,
  Level_V3,
  Period_V3,
  Place_V3,
  RepType_V3,
  Skill_V3,
  WeightType_V3,
} from '../types/enums';
import {
  AgeLabel,
  BlockTypeLabel,
  ChallengeLevelLabel,
  DifficultyLabel,
  ElementLabel,
  ExerciseCategoryLabel,
  ExercisePropLabels,
  ImpactLabel,
  LevelLabel,
  PeriodLabel,
  PlaceLabel,
  RepTypeLabel,
  SkillLabel,
  WeightTypeLabel,
} from '../types/labels';
import { Exercise_V3 } from '../types/types';
import { ExerciseMediaDropZone } from './ExerciseMediaDropZone';
import { Exercises2ContextValue } from '../panels/ExercisesV3Layout';
import { normalizeForSearch } from '../utils/textSearch';

const IMAGE_ACCEPT =
  'image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/tiff,image/svg+xml';
const ALLOWED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
]);
const ALLOWED_IMAGE_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
  '.svg',
]);

function assetNameFromUrl(rawUrl: string): string {
  const url = rawUrl.trim();
  if (!url) {
    return '';
  }
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? '';
    return decodeURIComponent(last) || url;
  } catch {
    const parts = url.split('/').filter(Boolean);
    const last = parts[parts.length - 1] ?? '';
    return decodeURIComponent(last) || url;
  }
}

function isAllowedImageFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase();
  if (mime && ALLOWED_IMAGE_MIME.has(mime)) {
    return true;
  }
  const dot = file.name.lastIndexOf('.');
  if (dot < 0) {
    return false;
  }
  const ext = file.name.slice(dot).toLowerCase();
  return ALLOWED_IMAGE_EXT.has(ext);
}

function toggleEnumValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

type EnumCheckboxGroupProps<T extends string> = {
  id: string;
  label: string;
  options: T[];
  labelMap: Record<T, string>;
  values: T[];
  onChange: (values: T[]) => void;
};

function EnumCheckboxGroup<T extends string>({
  id,
  label,
  options,
  labelMap,
  values,
  onChange,
}: EnumCheckboxGroupProps<T>) {
  return (
    <div className="exercise-form-field exercise-form-field--full-row">
      <span id={id} className="exercise-form-field-label">
        {label}
      </span>
      <div
        className="exercise-form-checkbox-group"
        role="group"
        aria-labelledby={id}
      >
        {options.map((option) => (
          <label key={option} className="exercise-form-checkbox-label">
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={() => onChange(toggleEnumValue(values, option))}
            />
            <span>{labelMap[option]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

type OptionalEnumSelectProps<T extends string> = {
  id: string;
  label: string;
  value: T | undefined;
  options: T[];
  labelMap: Record<T, string>;
  emptyLabel: string;
  onChange: (value: T | undefined) => void;
};

function OptionalEnumSelect<T extends string>({
  id,
  label,
  value,
  options,
  labelMap,
  emptyLabel,
  onChange,
}: OptionalEnumSelectProps<T>) {
  return (
    <div className="exercise-form-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next ? (next as T) : undefined);
        }}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labelMap[option]}
          </option>
        ))}
      </select>
    </div>
  );
}

function applyExerciseToForm(
  exercise: Exercise_V3,
  setters: {
    setName: (v: string) => void;
    setDescription: (v: string) => void;
    setRepType: (v: RepType_V3) => void;
    setAges: (v: Age_V3[]) => void;
    setLevel: (v: Level_V3) => void;
    setPlaces: (v: Place_V3[]) => void;
    setPeriods: (v: Period_V3[]) => void;
    setBlockTypes: (v: BlockType_V3[]) => void;
    setCategories: (v: ExerciseCategory_V3[]) => void;
    setSkills: (v: Skill_V3[]) => void;
    setChallengeLevel: (v: ChallengeLevel_V3 | undefined) => void;
    setMainMuscle: (v: string) => void;
    setElements: (v: Element_V3[]) => void;
    setWeightType: (v: WeightType_V3 | undefined) => void;
    setImpact: (v: Impact_V3 | undefined) => void;
    setDifficulty: (v: Difficulty_V3 | undefined) => void;
    setSistituteGroup: (v: string) => void;
    setPriorVideoUrl: (v: string) => void;
    setPriorImageUrl: (v: string) => void;
  }
) {
  setters.setName(exercise.name);
  setters.setDescription(exercise.description);
  setters.setRepType(exercise.repType);
  setters.setAges(exercise.ages);
  setters.setLevel(exercise.level);
  setters.setPlaces(exercise.places);
  setters.setPeriods(exercise.periods ?? []);
  setters.setBlockTypes(exercise.blockTypes);
  setters.setCategories(exercise.categories);
  setters.setSkills(exercise.skills ?? []);
  setters.setChallengeLevel(exercise.challengeLevel);
  setters.setMainMuscle(exercise.mainMuscle ?? '');
  setters.setElements(exercise.elements ?? []);
  setters.setWeightType(exercise.weightType);
  setters.setImpact(exercise.impact);
  setters.setDifficulty(exercise.difficulty);
  setters.setSistituteGroup(exercise.sistituteGroup ?? '');
  setters.setPriorVideoUrl(exercise.videoUrl ?? '');
  setters.setPriorImageUrl(exercise.imageUrl ?? '');
}

export function ExerciseV3Form() {
  const { t } = useTranslation();
  const { id: editId } = useParams();
  const { exercises, dataLoading, dataError, updateExercise } =
    useOutletContext<Exercises2ContextValue>();
  const navigate = useNavigate();

  const nameId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descId = useId();
  const repTypeId = useId();
  const agesId = useId();
  const levelId = useId();
  const placesId = useId();
  const periodId = useId();
  const blockTypeId = useId();
  const categoryId = useId();
  const skillId = useId();
  const challengeLevelId = useId();
  const mainMuscleId = useId();
  const elementsId = useId();
  const weightTypeId = useId();
  const impactId = useId();
  const difficultyId = useId();
  const sistituteGroupId = useId();
  const videoId = useId();
  const imageId = useId();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repType, setRepType] = useState<RepType_V3>(RepType_V3.REPETITIONS);
  const [ages, setAges] = useState<Age_V3[]>([]);
  const [level, setLevel] = useState<Level_V3>(Level_V3.RECREATIONAL);
  const [places, setPlaces] = useState<Place_V3[]>([]);
  const [periods, setPeriods] = useState<Period_V3[]>([]);
  const [blockTypes, setBlockTypes] = useState<BlockType_V3[]>([]);
  const [categories, setCategories] = useState<ExerciseCategory_V3[]>([]);
  const [skills, setSkills] = useState<Skill_V3[]>([]);
  const [challengeLevel, setChallengeLevel] = useState<
    ChallengeLevel_V3 | undefined
  >();
  const [mainMuscle, setMainMuscle] = useState('');
  const [elements, setElements] = useState<Element_V3[]>([]);
  const [weightType, setWeightType] = useState<WeightType_V3 | undefined>();
  const [impact, setImpact] = useState<Impact_V3 | undefined>();
  const [difficulty, setDifficulty] = useState<Difficulty_V3 | undefined>();
  const [sistituteGroup, setSistituteGroup] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [priorVideoUrl, setPriorVideoUrl] = useState('');
  const [priorImageUrl, setPriorImageUrl] = useState('');
  const [removeVideoOnSave, setRemoveVideoOnSave] = useState(false);
  const [removeImageOnSave, setRemoveImageOnSave] = useState(false);
  const [videoInputKey, setVideoInputKey] = useState(0);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [nameDuplicateError, setNameDuplicateError] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!editId) {
      navigate('..', { replace: true });
      return;
    }
    if (dataLoading) {
      return;
    }

    const existing = exercises.find((exercise) => exercise.id === editId);
    if (!existing) {
      navigate('..', { replace: true });
      return;
    }

    applyExerciseToForm(existing, {
      setName,
      setDescription,
      setRepType,
      setAges,
      setLevel,
      setPlaces,
      setPeriods,
      setBlockTypes,
      setCategories,
      setSkills,
      setChallengeLevel,
      setMainMuscle,
      setElements,
      setWeightType,
      setImpact,
      setDifficulty,
      setSistituteGroup,
      setPriorVideoUrl,
      setPriorImageUrl,
    });
    setVideoFile(null);
    setImageFile(null);
    setRemoveVideoOnSave(false);
    setRemoveImageOnSave(false);
    setValidationError('');
    setNameDuplicateError('');
    setMediaError('');
    setSaveError('');
  }, [editId, dataLoading, exercises, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editId) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName) {
      setValidationError(t('exercises.validationName'));
      return;
    }
    if (!trimmedDescription) {
      setValidationError(t('exercises.validationDescription'));
      return;
    }
    if (ages.length === 0) {
      setValidationError(t('exercises2.validationAges'));
      return;
    }
    if (places.length === 0) {
      setValidationError(t('exercises2.validationPlaces'));
      return;
    }
    if (blockTypes.length === 0) {
      setValidationError(t('exercises2.validationBlockTypes'));
      return;
    }
    if (categories.length === 0) {
      setValidationError(t('exercises2.validationCategories'));
      return;
    }

    const normalizedName = normalizeForSearch(trimmedName);
    const nameTaken = exercises.some(
      (exercise) =>
        exercise.id !== editId &&
        normalizeForSearch(exercise.name) === normalizedName
    );
    if (nameTaken) {
      setNameDuplicateError(t('exercises.duplicateName'));
      nameInputRef.current?.focus();
      nameInputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    setValidationError('');
    setNameDuplicateError('');
    setSaveError('');

    const trimmedMainMuscle = mainMuscle.trim();
    const trimmedSistituteGroup = sistituteGroup.trim();
    const existingExercise = exercises.find((item) => item.id === editId);

    const exercise: Exercise_V3 = {
      id: editId,
      name: trimmedName,
      description: trimmedDescription,
      repType,
      ages,
      level,
      places,
      blockTypes,
      categories,
      version: existingExercise?.version ?? EXERCISE_2_VERSION,
      ...(periods.length > 0 ? { periods } : {}),
      ...(skills.length > 0 ? { skills } : {}),
      ...(challengeLevel !== undefined ? { challengeLevel } : {}),
      ...(trimmedMainMuscle ? { mainMuscle: trimmedMainMuscle } : {}),
      ...(elements.length > 0 ? { elements } : {}),
      ...(weightType !== undefined ? { weightType } : {}),
      ...(impact !== undefined ? { impact } : {}),
      ...(difficulty !== undefined ? { difficulty } : {}),
      ...(trimmedSistituteGroup
        ? { sistituteGroup: trimmedSistituteGroup }
        : {}),
    };

    if (!removeVideoOnSave && priorVideoUrl.trim() && videoFile == null) {
      exercise.videoUrl = priorVideoUrl.trim();
    }
    if (!removeImageOnSave && priorImageUrl.trim() && imageFile == null) {
      exercise.imageUrl = priorImageUrl.trim();
    }

    const hasMediaChanges =
      videoFile != null ||
      imageFile != null ||
      removeVideoOnSave ||
      removeImageOnSave;

    setIsSaving(true);
    try {
      await updateExercise({
        exercise,
        ...(hasMediaChanges
          ? {
              media: {
                ...(videoFile != null ? { video: videoFile } : {}),
                ...(imageFile != null ? { image: imageFile } : {}),
              },
            }
          : {}),
      });
      navigate('..', { replace: false });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t('exercises.saveFailed');
      setSaveError(msg);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-panel app-panel--full exercise-form-panel">
      <h2 className="exercise-form-title">{t('exercises2.editExercise')}</h2>
      {dataLoading ? (
        <p className="app-data-banner">{t('exercises2.loadingList')}</p>
      ) : null}
      {dataError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {dataError}
        </p>
      ) : null}
      {mediaError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {mediaError}
        </p>
      ) : null}
      {validationError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {validationError}
        </p>
      ) : null}
      {saveError ? (
        <p className="app-data-banner app-data-banner--error" role="alert">
          {saveError}
        </p>
      ) : null}
      <form
        className="exercise-form exercise-v3-form"
        noValidate
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
      >
        <div className="exercise-form-field">
          <label htmlFor={nameId}>{ExercisePropLabels.name}</label>
          <input
            ref={nameInputRef}
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameDuplicateError('');
              setValidationError('');
            }}
            required
            autoComplete="off"
            aria-invalid={nameDuplicateError ? true : undefined}
            aria-describedby={
              nameDuplicateError ? `${nameId}-error` : undefined
            }
          />
          {nameDuplicateError ? (
            <p
              id={`${nameId}-error`}
              className="exercise-form-error"
              role="alert"
            >
              {nameDuplicateError}
            </p>
          ) : null}
        </div>

        <div className="exercise-form-field">
          <label htmlFor={repTypeId}>{ExercisePropLabels.repType}</label>
          <select
            id={repTypeId}
            value={repType}
            onChange={(e) => setRepType(e.target.value as RepType_V3)}
          >
            {Object.values(RepType_V3).map((option) => (
              <option key={option} value={option}>
                {RepTypeLabel[option]}
              </option>
            ))}
          </select>
        </div>

        <div className="exercise-form-field">
          <label htmlFor={levelId}>{ExercisePropLabels.level}</label>
          <select
            id={levelId}
            value={level}
            onChange={(e) => setLevel(e.target.value as Level_V3)}
          >
            {Object.values(Level_V3).map((option) => (
              <option key={option} value={option}>
                {LevelLabel[option]}
              </option>
            ))}
          </select>
        </div>

        <div className="exercise-form-field exercise-form-field--full-row">
          <label htmlFor={descId}>{ExercisePropLabels.description}</label>
          <textarea
            id={descId}
            className="exercise-form-textarea"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setValidationError('');
            }}
            rows={8}
            required
          />
        </div>

        <OptionalEnumSelect
          id={challengeLevelId}
          label={ExercisePropLabels.challengeLevel}
          value={challengeLevel}
          options={Object.values(ChallengeLevel_V3)}
          labelMap={ChallengeLevelLabel}
          emptyLabel={t('exercises2.optionalEmpty')}
          onChange={setChallengeLevel}
        />

        <div className="exercise-form-field">
          <label htmlFor={mainMuscleId}>{ExercisePropLabels.mainMuscle}</label>
          <input
            id={mainMuscleId}
            type="text"
            value={mainMuscle}
            onChange={(e) => setMainMuscle(e.target.value)}
            autoComplete="off"
          />
        </div>

        <OptionalEnumSelect
          id={weightTypeId}
          label={ExercisePropLabels.weightType}
          value={weightType}
          options={Object.values(WeightType_V3)}
          labelMap={WeightTypeLabel}
          emptyLabel={t('exercises2.optionalEmpty')}
          onChange={setWeightType}
        />

        <OptionalEnumSelect
          id={impactId}
          label={ExercisePropLabels.impact}
          value={impact}
          options={Object.values(Impact_V3)}
          labelMap={ImpactLabel}
          emptyLabel={t('exercises2.optionalEmpty')}
          onChange={setImpact}
        />

        <OptionalEnumSelect
          id={difficultyId}
          label={ExercisePropLabels.difficulty}
          value={difficulty}
          options={Object.values(Difficulty_V3)}
          labelMap={DifficultyLabel}
          emptyLabel={t('exercises2.optionalEmpty')}
          onChange={setDifficulty}
        />

        <div className="exercise-form-field">
          <label htmlFor={sistituteGroupId}>
            {ExercisePropLabels.sistituteGroup}
          </label>
          <input
            id={sistituteGroupId}
            type="text"
            value={sistituteGroup}
            onChange={(e) => setSistituteGroup(e.target.value)}
            autoComplete="off"
          />
        </div>

        <EnumCheckboxGroup
          id={agesId}
          label={ExercisePropLabels.ages}
          options={Object.values(Age_V3)}
          labelMap={AgeLabel}
          values={ages}
          onChange={(next) => {
            setAges(next);
            setValidationError('');
          }}
        />

        <EnumCheckboxGroup
          id={placesId}
          label={ExercisePropLabels.places}
          options={Object.values(Place_V3)}
          labelMap={PlaceLabel}
          values={places}
          onChange={(next) => {
            setPlaces(next);
            setValidationError('');
          }}
        />

        <EnumCheckboxGroup
          id={periodId}
          label={ExercisePropLabels.periods}
          options={Object.values(Period_V3)}
          labelMap={PeriodLabel}
          values={periods}
          onChange={setPeriods}
        />

        <EnumCheckboxGroup
          id={blockTypeId}
          label={ExercisePropLabels.blockTypes}
          options={Object.values(BlockType_V3)}
          labelMap={BlockTypeLabel}
          values={blockTypes}
          onChange={(next) => {
            setBlockTypes(next);
            setValidationError('');
          }}
        />

        <EnumCheckboxGroup
          id={categoryId}
          label={ExercisePropLabels.categories}
          options={Object.values(ExerciseCategory_V3)}
          labelMap={ExerciseCategoryLabel}
          values={categories}
          onChange={(next) => {
            setCategories(next);
            setValidationError('');
          }}
        />

        <EnumCheckboxGroup
          id={skillId}
          label={ExercisePropLabels.skills}
          options={Object.values(Skill_V3)}
          labelMap={SkillLabel}
          values={skills}
          onChange={setSkills}
        />

        <EnumCheckboxGroup
          id={elementsId}
          label={ExercisePropLabels.elements}
          options={Object.values(Element_V3)}
          labelMap={ElementLabel}
          values={elements}
          onChange={setElements}
        />

        <ExerciseMediaDropZone
          id={videoId}
          inputKey={videoInputKey}
          accept="video/*"
          fieldLabel={ExercisePropLabels.videoUrl}
          clearLabel={t('exercises.clearVideo')}
          hintLine={t('exercises.videoHint')}
          valueFile={videoFile}
          savedDisplayName={
            !videoFile && priorVideoUrl.trim()
              ? assetNameFromUrl(priorVideoUrl)
              : ''
          }
          onPickFile={(file) => {
            setVideoFile(file);
            if (file) {
              setRemoveVideoOnSave(false);
            }
            setMediaError('');
          }}
          onClear={() => {
            setVideoFile(null);
            setPriorVideoUrl('');
            setRemoveVideoOnSave(true);
            setVideoInputKey((k) => k + 1);
          }}
          showClear={videoFile != null || priorVideoUrl.trim() !== ''}
          replaceHint={
            priorVideoUrl.trim() !== '' && videoFile == null
              ? t('exercises.replaceFile')
              : undefined
          }
        />

        <ExerciseMediaDropZone
          id={imageId}
          inputKey={imageInputKey}
          accept={IMAGE_ACCEPT}
          fieldLabel={ExercisePropLabels.imageUrl}
          clearLabel={t('exercises.clearImage')}
          hintLine={t('exercises.imageHint')}
          valueFile={imageFile}
          savedDisplayName={
            !imageFile && priorImageUrl.trim()
              ? assetNameFromUrl(priorImageUrl)
              : ''
          }
          onPickFile={(file) => {
            if (!file) {
              setImageFile(null);
              return;
            }
            if (!isAllowedImageFile(file)) {
              setImageFile(null);
              setImageInputKey((k) => k + 1);
              setMediaError(t('exercises.imageInvalid'));
              return;
            }
            setImageFile(file);
            setRemoveImageOnSave(false);
            setMediaError('');
          }}
          onClear={() => {
            setImageFile(null);
            setPriorImageUrl('');
            setRemoveImageOnSave(true);
            setImageInputKey((k) => k + 1);
          }}
          showClear={imageFile != null || priorImageUrl.trim() !== ''}
          replaceHint={
            priorImageUrl.trim() !== '' && imageFile == null
              ? t('exercises.replaceFile')
              : undefined
          }
        />

        <div className="exercise-form-actions exercise-form-field--full-row">
          <button
            type="button"
            className="exercise-form-cancel"
            onClick={() => navigate('..')}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="exercise-form-submit"
            disabled={isSaving}
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
