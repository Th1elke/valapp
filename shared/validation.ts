export const MAX_NAME_LENGTH = 50
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 16

/** Matches emoji and other pictographic symbols — keeps names/passwords restricted to plain text. */
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u

export function containsEmoji(value: string): boolean {
  return EMOJI_PATTERN.test(value)
}
