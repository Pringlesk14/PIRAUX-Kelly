/** Minimum age to use Everglow, like the major platforms. */
export const MIN_AGE = 13;
/** In France, under 15 a parent must agree to the processing of personal data. */
export const PARENTAL_CONSENT_UNDER = 15;

/** Age in whole years for a YYYY-MM-DD birthdate, or NaN if the date is invalid. */
export function ageFrom(birthdate: string, now = new Date()): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate);
  if (!m) return NaN;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d || date > now) return NaN;
  let age = now.getFullYear() - y;
  if (now.getMonth() < mo - 1 || (now.getMonth() === mo - 1 && now.getDate() < d)) age--;
  return age;
}
