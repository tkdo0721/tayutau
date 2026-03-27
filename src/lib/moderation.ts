// NGワード・パターンフィルター
// 投稿やコメントの本文に含まれていたらブロックする

// NGワードリスト（必要に応じて追加）
const NG_WORDS = [
  // 誹謗中傷
  "死ね", "殺す", "殺してやる", "消えろ",
  "きもい", "きめえ", "キモい",
  "ガイジ", "池沼", "障害者",
  "ブス", "デブ", "ハゲ",
  "クソガキ", "ゴミ",
  // 差別
  "チョン", "シナ人",
  // 脅迫
  "爆破", "放火", "襲う",
  // スパム
  "LINE交換", "LINE教えて",
  "インスタ教えて", "フォローして",
  "副業", "稼げる", "儲かる",
  "出会い系", "セフレ",
];

// 個人情報パターン（正規表現）
const NG_PATTERNS = [
  // 電話番号（ハイフンあり・なし）
  /0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/,
  // メールアドレス
  /[\w.+-]+@[\w-]+\.[\w.]+/,
  // URL（誘導防止）
  /https?:\/\/\S+/,
  // 住所っぽいパターン（〇〇市〇〇町〇丁目）
  /.{1,4}[市区町村].{1,8}[町丁]\d/,
];

export interface ModerationResult {
  ok: boolean;
  reason?: string;
}

export function moderateText(text: string): ModerationResult {
  // NGワードチェック
  const lowerText = text.toLowerCase();
  for (const word of NG_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return { ok: false, reason: "不適切な表現が含まれています" };
    }
  }

  // パターンチェック
  for (const pattern of NG_PATTERNS) {
    if (pattern.test(text)) {
      return { ok: false, reason: "個人情報やURLを含む投稿はできません" };
    }
  }

  return { ok: true };
}
