import { ulid } from 'ulid';

/** Generate a ULID — time-ordered, URL-safe, 26 chars. */
export function newId(): string {
  return ulid();
}
