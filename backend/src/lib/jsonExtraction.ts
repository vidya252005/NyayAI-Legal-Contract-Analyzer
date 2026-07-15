/**
 * Utilities for robustly extracting JSON objects from LLM text output.
 *
 * LLMs asked to emit "one JSON object per line" do not reliably keep every
 * object on a single line -- clause text or explanations can legitimately
 * contain characters that make naive `split("\n")` parsing cut an object in
 * half. These helpers scan character-by-character, tracking string/escape
 * state and brace depth, so object boundaries are found correctly regardless
 * of embedded whitespace or newlines inside string values.
 */

interface ScanState {
  depth: number;
  inString: boolean;
  escaped: boolean;
  objectStart: number;
  /** Index into `buffer` of the next character to scan. Characters before
   * this have already been consumed and must never be re-scanned, or the
   * persisted inString/escaped/depth flags get corrupted by re-toggling on
   * characters that were already accounted for. */
  scanIndex: number;
}

const freshState = (): ScanState => ({
  depth: 0,
  inString: false,
  escaped: false,
  objectStart: -1,
  scanIndex: 0,
});

/**
 * Incrementally extracts complete top-level `{...}` JSON objects from a
 * growing text buffer. Call `push` with new text as it arrives; it returns
 * any complete objects found so far and leaves the remainder (a
 * still-in-progress object, or leading junk/whitespace) in the internal
 * buffer for the next call. Call `flush` at end-of-stream to retrieve the
 * text of any still-incomplete trailing object (useful for logging/diagnosis
 * -- it will usually fail to parse as JSON since it's incomplete).
 */
export class JsonObjectStreamScanner {
  private buffer = "";
  private state = freshState();

  push(text: string): string[] {
    this.buffer += text;
    const found: string[] = [];

    let i = this.state.scanIndex;
    while (i < this.buffer.length) {
      const ch = this.buffer[i];

      if (this.state.inString) {
        if (this.state.escaped) {
          this.state.escaped = false;
        } else if (ch === "\\") {
          this.state.escaped = true;
        } else if (ch === '"') {
          this.state.inString = false;
        }
        i += 1;
        continue;
      }

      if (ch === '"') {
        this.state.inString = true;
        i += 1;
        continue;
      }

      if (ch === "{") {
        if (this.state.depth === 0) {
          this.state.objectStart = i;
        }
        this.state.depth += 1;
        i += 1;
        continue;
      }

      if (ch === "}") {
        if (this.state.depth > 0) {
          this.state.depth -= 1;
          if (this.state.depth === 0 && this.state.objectStart >= 0) {
            found.push(this.buffer.slice(this.state.objectStart, i + 1));
            // Drop the consumed object from the buffer and reset indices
            // relative to the trimmed buffer, so memory doesn't grow
            // unbounded across a long stream.
            this.buffer = this.buffer.slice(i + 1);
            this.state.objectStart = -1;
            i = -1;
          }
        }
      }

      i += 1;
    }

    this.state.scanIndex = Math.max(i, 0);
    return found;
  }

  flush(): string | null {
    const remainder = this.buffer.trim();
    this.buffer = "";
    this.state = freshState();
    return remainder.length > 0 ? remainder : null;
  }
}

/**
 * Extracts the first balanced top-level `{...}` JSON object from arbitrary
 * text (e.g. a non-streamed LLM response that may be wrapped in markdown
 * fences or preceded/followed by stray prose). Returns null if no balanced
 * object is found.
 */
export const extractFirstJsonObject = (text: string): string | null => {
  const scanner = new JsonObjectStreamScanner();
  const found = scanner.push(text);
  return found[0] ?? null;
};
