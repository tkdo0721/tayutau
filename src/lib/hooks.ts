"use client";

import { useState, useEffect, useCallback } from "react";
import type { GeoLocation } from "./types";

export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setError("お使いのブラウザは位置情報に対応していません");
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "位置情報の許可が必要です。ブラウザの設定を確認してください。"
            : "位置情報を取得できませんでした"
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { location, error, loading, refresh };
}
