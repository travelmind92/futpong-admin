export type CsvDelimiter = ';' | ',';

export type ParseCsvRecordsResult = {
  records: string[][];
  malformed: boolean;
};

/**
 * Parses CSV text into rows, respecting quoted fields (including embedded newlines).
 */
export function parseCsvRecords(
  text: string,
  delimiter: CsvDelimiter
): ParseCsvRecordsResult {
  const records: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };

  const pushRow = () => {
    records.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      pushField();
    } else if (char === '\r') {
      // Handled when \n follows; ignore lone \r.
    } else if (char === '\n') {
      pushField();
      pushRow();
    } else {
      field += char;
    }
  }

  pushField();
  if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
    pushRow();
  }

  return {
    records,
    malformed: inQuotes,
  };
}
