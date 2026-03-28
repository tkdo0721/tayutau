"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  text: string;
  /** 1文字あたりの表示間隔（ms） デフォルト60ms */
  speed?: number;
  /** アニメーション開始までの遅延（ms） デフォルト0 */
  delay?: number;
  className?: string;
}

/**
 * テキストを1文字ずつタイプライターのように表示するコンポーネント。
 * 同じ text が渡され続ける限り、アニメーションは1回だけ再生される。
 * text が変わった場合（距離の変化で visibleText が変わるなど）は
 * 既に表示済みの部分はそのまま、新たに増えた文字だけをアニメーションする。
 */
export default function TypewriterText({
  text,
  speed = 60,
  delay = 0,
  className,
}: Props) {
  // 現在画面に表示している文字数
  const [displayLen, setDisplayLen] = useState(0);
  // アニメーション済みのテキストを追跡
  const prevTextRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // テキストが変わった場合、既に表示した共通プレフィックスは維持する
    const prev = prevTextRef.current;
    let commonLen = 0;
    for (let i = 0; i < Math.min(prev.length, text.length); i++) {
      if (prev[i] === text[i]) commonLen = i + 1;
      else break;
    }

    // 新テキストが短くなった場合は即座に反映
    const startFrom = Math.min(displayLen, commonLen);
    setDisplayLen(startFrom);
    prevTextRef.current = text;

    if (startFrom >= text.length) return;

    // delay 後に1文字ずつ追加
    const initialDelay = startFrom === 0 ? delay : 0;
    let current = startFrom;

    const startTyping = () => {
      const tick = () => {
        current++;
        setDisplayLen(current);
        if (current < text.length) {
          timerRef.current = setTimeout(tick, speed);
        }
      };
      timerRef.current = setTimeout(tick, speed);
    };

    timerRef.current = setTimeout(startTyping, initialDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // text が変わったときだけ再実行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, delay]);

  return <span className={className}>{text.slice(0, displayLen)}</span>;
}
