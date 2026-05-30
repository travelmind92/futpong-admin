import React, {
  KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';

type ComboSelectFieldProps = {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  controlWidth?: number;
};

function filterOptions(options: readonly string[], query: string): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [...options];
  }
  return options.filter((option) =>
    option.toLowerCase().includes(normalized)
  );
}

export function ComboSelectField({
  id,
  label,
  value,
  options,
  onChange,
  controlWidth,
}: ComboSelectFieldProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const filteredOptions = useMemo(
    () => filterOptions(options, value),
    [options, value]
  );

  const showList = open && filteredOptions.length > 0;

  useEffect(() => {
    setHighlightIndex(-1);
  }, [value, filteredOptions.length]);

  const selectOption = (option: string) => {
    onChange(option);
    setOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showList && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      if (filteredOptions.length > 0) {
        setOpen(true);
        setHighlightIndex(e.key === 'ArrowDown' ? 0 : filteredOptions.length - 1);
      }
      e.preventDefault();
      return;
    }

    if (!showList) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
          e.preventDefault();
          selectOption(filteredOptions[highlightIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setHighlightIndex(-1);
        break;
      default:
        break;
    }
  };

  const activeOptionId =
    highlightIndex >= 0 ? `${id}-option-${highlightIndex}` : undefined;

  return (
    <div
      className="exercise-form-field combo-select-field"
      style={controlWidth != null ? { alignSelf: 'flex-start' } : undefined}
    >
      <label htmlFor={id}>{label}</label>
      <div
        className="combo-select-field__control"
        style={controlWidth != null ? { width: controlWidth } : undefined}
      >
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList ? activeOptionId : undefined}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false);
              setHighlightIndex(-1);
            }, 150);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {showList ? (
          <ul
            id={listId}
            role="listbox"
            className="combo-select-field__list"
          >
            {filteredOptions.map((option, index) => (
              <li
                key={option}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={option === value}
                className={
                  index === highlightIndex
                    ? 'combo-select-field__option combo-select-field__option--active'
                    : 'combo-select-field__option'
                }
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => selectOption(option)}
              >
                {option}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
