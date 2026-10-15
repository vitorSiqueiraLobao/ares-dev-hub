import { Parser } from 'node-sql-parser';
import fs from 'fs/promises';
import path from 'path';

export interface SqlValidationResult {
  valid: boolean;
  reason?: string;
  ast?: any;
  statementCount?: number;
  hasLimit?: boolean;
  sanitizedSql?: string;
}

export class SqlGuard {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  /**
   * Validates that the provided SQL content is strictly READ-ONLY (only SELECT statements).
   */
  public validate(sqlContent: string, databaseDialect: string = 'postgresql'): SqlValidationResult {
    const trimmed = sqlContent.trim();
    if (!trimmed) {
      return { valid: false, reason: 'Arquivo SQL vazio.' };
    }

    try {
      const ast = this.parser.astify(trimmed, { database: databaseDialect });
      const statements = Array.isArray(ast) ? ast : [ast];

      if (statements.length === 0) {
        return { valid: false, reason: 'Nenhuma instrução SQL válida identificada.' };
      }

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (!stmt || stmt.type !== 'select') {
          return {
            valid: false,
            reason: `Instrução não autorizada na query ${i + 1}: tipo detectado '${stmt?.type || 'desconhecido'}'. Apenas SELECT é permitido.`,
            statementCount: statements.length,
          };
        }
      }

      // Check if limit exists on statements
      let hasLimit = true;
      for (const stmt of statements) {
        if (!(stmt as any).limit) {
          hasLimit = false;
          break;
        }
      }

      return {
        valid: true,
        statementCount: statements.length,
        hasLimit,
        ast,
      };
    } catch (err: any) {
      // Fallback check: regex-based strict guard if parser fails on custom dialect keywords
      return this.fallbackValidate(trimmed, err.message);
    }
  }

  /**
   * Reads a raw .sql file from disk and validates it.
   */
  public async validateFile(filePath: string, databaseDialect: string = 'postgresql'): Promise<SqlValidationResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.validate(content, databaseDialect);
    } catch (err: any) {
      return { valid: false, reason: `Erro ao ler arquivo ${filePath}: ${err.message}` };
    }
  }

  /**
   * Injects a row limit if configured. If maxRows is null, 0 or negative, leaves query without limit.
   */
  public applySafetyLimit(sqlContent: string, maxRows: number | null = 50): string {
    const trimmed = sqlContent.trim().replace(/;+$/, '');
    
    // If user explicitly configured unlimited (0, null, or negative), do not inject limit
    if (maxRows === null || maxRows === undefined || maxRows <= 0) {
      return trimmed;
    }

    // Check if limit or top is already present
    if (/\b(LIMIT\s+\d+|TOP\s+\d+|FETCH\s+FIRST\s+\d+\s+ROWS)\b/i.test(trimmed)) {
      return trimmed;
    }

    // Append standard LIMIT
    return `${trimmed} LIMIT ${maxRows}`;
  }

  /**
   * Strict regex guard as an additional safety layer or fallback
   */
  private fallbackValidate(sqlContent: string, parserErrorMessage: string): SqlValidationResult {
    // Prohibited keywords
    const prohibitedKeywords = [
      /\b(INSERT\s+INTO)\b/i,
      /\b(UPDATE\s+[a-zA-Z0-9_]+)\b/i,
      /\b(DELETE\s+FROM)\b/i,
      /\b(DROP\s+(TABLE|VIEW|INDEX|DATABASE|PROCEDURE|FUNCTION|SCHEMA))\b/i,
      /\b(ALTER\s+(TABLE|VIEW|DATABASE|SCHEMA))\b/i,
      /\b(TRUNCATE\s+TABLE)\b/i,
      /\b(CREATE\s+(TABLE|VIEW|INDEX|DATABASE|PROCEDURE|FUNCTION|TRIGGER))\b/i,
      /\b(GRANT|REVOKE)\b/i,
      /\b(EXEC|EXECUTE)\b/i,
    ];

    for (const pattern of prohibitedKeywords) {
      if (pattern.test(sqlContent)) {
        return {
          valid: false,
          reason: `Instrução potencialmente perigosa detectada pelo guardião: ${pattern.source}`,
        };
      }
    }

    // Must start with SELECT or WITH (for CTEs)
    if (!/^\s*(SELECT|WITH)\b/i.test(sqlContent)) {
      return {
        valid: false,
        reason: `A instrução deve iniciar com SELECT ou WITH. Erro de parser: ${parserErrorMessage}`,
      };
    }

    return {
      valid: true,
      hasLimit: /\b(LIMIT\s+\d+|TOP\s+\d+)\b/i.test(sqlContent),
    };
  }
}

export const sqlGuard = new SqlGuard();
