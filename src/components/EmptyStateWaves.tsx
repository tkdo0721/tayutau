"use client";

import { useEffect, useRef } from "react";

/**
 * 空白状態の演出 — 3本の曲線がたゆたうアニメーション
 * 投稿が0件のとき表示し、「場所が呼吸している」ような気配だけを伝える。
 * テキストやアイコンは一切なし。
 */
interface Props {
  /** true のとき表示（フェードイン）、false のときフェードアウト */
  visible: boolean;
}

// 各曲線のパラメータ
interface CurveConfig {
  /** Y座標の基準（0–1, 画面中央が0.5） */
  baseY: number;
  /** 振幅（px） */
  amplitude: number;
  /** 周期（曲線内の山の数） */
  frequency: number;
  /** アニメーション周期（秒） */
  period: number;
  /** 位相オフセット */
  phaseOffset: number;
  /** 線の色（rgba） */
  color: string;
  /** 線幅 */
  lineWidth: number;
}

const CURVES: CurveConfig[] = [
  {
    baseY: 0.42,
    amplitude: 30,
    frequency: 1.2,
    period: 12,
    phaseOffset: 0,
    color: "rgba(165, 165, 180, 0.18)",
    lineWidth: 1.5,
  },
  {
    baseY: 0.50,
    amplitude: 22,
    frequency: 1.5,
    period: 15,
    phaseOffset: 2.1,
    color: "rgba(165, 165, 180, 0.13)",
    lineWidth: 1.2,
  },
  {
    baseY: 0.58,
    amplitude: 26,
    frequency: 1.0,
    period: 18,
    phaseOffset: 4.2,
    color: "rgba(165, 165, 180, 0.15)",
    lineWidth: 1.4,
  },
];

export default function EmptyStateWaves({ visible }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const opacityRef = useRef(visible ? 1 : 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const drawCurve = (
      config: CurveConfig,
      time: number,
      w: number,
      h: number,
      globalOpacity: number
    ) => {
      const { baseY, amplitude, frequency, period, phaseOffset, color, lineWidth } =
        config;
      const y0 = h * baseY;
      const phase = ((time / period) * Math.PI * 2) + phaseOffset;

      // 第二の揺らぎ（ゆっくりとした呼吸のような変調）
      const breathe = Math.sin(time / (period * 1.7) + phaseOffset * 0.6) * 0.3 + 0.7;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = globalOpacity;

      const steps = Math.ceil(w / 2);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = t * w;

        // メインの波
        const wave =
          Math.sin(t * Math.PI * 2 * frequency + phase) * amplitude * breathe;
        // 副次的な揺らぎ（不規則さを出す）
        const sub =
          Math.sin(t * Math.PI * 2 * frequency * 2.3 + phase * 0.7) *
          amplitude *
          0.15 *
          breathe;

        // 端でフェードアウト（曲線が画面端で自然に消える）
        const edgeFade = Math.sin(t * Math.PI);
        const y = y0 + (wave + sub) * edgeFade;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const animate = (timestamp: number) => {
      if (!running) return;

      const time = timestamp / 1000;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      const w = rect.width;
      const h = rect.height;

      // フェードイン / フェードアウト（1秒かけて遷移）
      const targetOpacity = visible ? 1 : 0;
      const fadeSpeed = 0.02; // ~1秒 at 60fps
      if (opacityRef.current < targetOpacity) {
        opacityRef.current = Math.min(1, opacityRef.current + fadeSpeed);
      } else if (opacityRef.current > targetOpacity) {
        opacityRef.current = Math.max(0, opacityRef.current - fadeSpeed);
      }

      ctx.clearRect(0, 0, w, h);

      if (opacityRef.current > 0.001) {
        for (const curve of CURVES) {
          drawCurve(curve, time, w, h, opacityRef.current);
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [visible]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
