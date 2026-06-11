'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

// Renders a session's join code and a QR that points at /join/[code]. The base
// origin is read from the browser so it works on localhost, preview, and prod
// without configuration.
export function SessionQrCode({ code }: { code: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    const origin = window.location.origin;
    const url = `${origin}/join/${code}`;
    setJoinUrl(url);
    QRCode.toDataURL(url, { margin: 1, width: 192 })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-4">
      <p className="font-mono text-2xl font-bold tracking-[0.3em] text-slate-900">{code}</p>
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={`QR code to join session ${code}`} width={192} height={192} />
      ) : (
        <div className="h-48 w-48 animate-pulse rounded bg-slate-100" />
      )}
      {joinUrl && (
        <a
          href={joinUrl}
          target="_blank"
          rel="noreferrer"
          className="break-all text-center text-xs text-captivator-accent hover:underline"
        >
          {joinUrl}
        </a>
      )}
    </div>
  );
}
