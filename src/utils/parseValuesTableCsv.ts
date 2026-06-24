export type ValuesTableData = {
  headers: string[];
  rows: string[][];
};

export function parseValuesTableCsv(text: string): ValuesTableData {
  const lines = text
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].split(',').map((cell) => cell.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(',').map((cell) => cell.trim());
    while (cells.length < headers.length) {
      cells.push('');
    }
    return cells.slice(0, headers.length);
  });

  return { headers, rows };
}

export function appendEmptyOptionalValues(
  table: ValuesTableData,
  optionalHeaders: readonly string[],
  emptyValue: string
): ValuesTableData {
  if (table.headers.length === 0) {
    return table;
  }

  const optional = new Set(optionalHeaders);
  const rows = table.rows.map((row) => [...row]);

  for (let colIndex = 0; colIndex < table.headers.length; colIndex += 1) {
    const header = table.headers[colIndex];
    if (!optional.has(header)) {
      continue;
    }

    let lastValueRow = -1;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const cell = rows[rowIndex][colIndex]?.trim() ?? '';
      if (cell.length > 0 && cell !== emptyValue) {
        lastValueRow = rowIndex;
      }
    }

    const targetRow = lastValueRow + 1;
    while (rows.length <= targetRow) {
      rows.push(Array(table.headers.length).fill(''));
    }

    if (rows[targetRow][colIndex]?.trim() === emptyValue) {
      continue;
    }

    rows[targetRow][colIndex] = emptyValue;
  }

  return {
    headers: table.headers,
    rows,
  };
}
