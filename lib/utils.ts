import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 複数のクラス名を結合して単一の文字列にします。
 * @param inputs - 結合するクラス名。
 * @returns 結合されたクラス名の単一の文字列。
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * URLスラッグを人間が読める形式のタイトルにフォーマットします。
 * 例: "web-development" は "Web Development" になります。
 * @param slug - フォーマットするスラッグ。
 * @returns フォーマットされたタイトルの文字列。
 */
export function formatSlugAsTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
