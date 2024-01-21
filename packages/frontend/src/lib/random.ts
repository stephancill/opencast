const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function getRandomId(): string {
  return Array.from({ length: 20 }).reduce(
    (acc: string) => acc + CHARS[~~(Math.random() * CHARS.length)],
    ''
  );
}
