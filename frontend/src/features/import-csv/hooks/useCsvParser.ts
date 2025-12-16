import { useState, useCallback } from 'react';
import Papa from 'papaparse';

/**
 * Result of CSV parsing.
 */
export interface ParseResult {
  hasHeader: boolean;
  header: string[];
  rows: string[][];
  sample: string[][];
  totalRows: number;
}

/**
 * Hook for parsing CSV files using PapaParse.
 * 
 * @returns parse function and loading state
 */
export function useCsvParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(
    (
      file: File,
      options: {
        delimiter?: string;
        encoding?: string;
      } = {}
    ): Promise<ParseResult> => {
      return new Promise((resolve, reject) => {
        setIsLoading(true);
        setError(null);

        Papa.parse(file, {
          delimiter: options.delimiter || ',',
          encoding: options.encoding || 'utf-8',
          skipEmptyLines: true,
          worker: true,
          complete: (results) => {
            setIsLoading(false);

            if (results.errors.length > 0) {
              const errorMsg = results.errors
                .slice(0, 3)
                .map((e) => e.message)
                .join('; ');
              setError(errorMsg);
              reject(new Error(errorMsg));
              return;
            }

            const data = results.data as string[][];

            if (data.length === 0) {
              const errorMsg = 'CSV file is empty';
              setError(errorMsg);
              reject(new Error(errorMsg));
              return;
            }

            // Detect header by checking if first row has different data types than rest
            const hasHeader = detectHeader(data);

            const header = hasHeader ? data[0] : [];
            const rows = hasHeader ? data.slice(1) : data;
            const sample = rows.slice(0, 100);

            resolve({
              hasHeader,
              header,
              rows,
              sample: sample.slice(0, 20),
              totalRows: rows.length,
            });
          },
          error: (error) => {
            setIsLoading(false);
            const errorMsg = error.message || 'Failed to parse CSV';
            setError(errorMsg);
            reject(new Error(errorMsg));
          },
        });
      });
    },
    []
  );

  return {
    parse,
    isLoading,
    error,
  };
}

/**
 * Detect if the first row is a header by checking if it contains
 * mostly text while subsequent rows contain numbers.
 */
function detectHeader(data: string[][]): boolean {
  if (data.length < 2) return false;

  const firstRow = data[0];
  const secondRow = data[1];

  // Count numeric values in first row
  const firstRowNumeric = firstRow.filter((cell) => !isNaN(Number(cell))).length;
  // Count numeric values in second row
  const secondRowNumeric = secondRow.filter((cell) => !isNaN(Number(cell))).length;

  // If first row has significantly fewer numbers, it's likely a header
  return firstRowNumeric < secondRowNumeric || firstRowNumeric === 0;
}
