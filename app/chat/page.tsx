'use client';

import { useEffect, useRef } from 'react';

export default function ChatPage() {
  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = chatRef.current;
    if (!container) return;

    let widget: any = null;
    const scripts: HTMLScriptElement[] = [];

    const loadScript = (src: string) =>
      new Promise<HTMLScriptElement>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve(s);
        s.onerror = reject;
        document.body.appendChild(s);
        scripts.push(s);
      });

    loadScript('https://chat.peakd.com/stlib.js')
      .then(() => loadScript('https://chat.peakd.com/stwidget.js'))
      .then(() => {
        const StWidget = (window as any).StWidget;
        if (typeof StWidget === 'function') {
          widget = new StWidget('https://chat.peakd.com/t/hive-173115/0');
          widget.setProperties({
            allow_resize: true,
            use_dark_mode: false,
          });
          const element = widget.createElement('100%', '600px', false, false);
          container.appendChild(element);
        }
      })
      .catch(() => {});

    return () => {
      scripts.forEach((s) => s.parentNode?.removeChild(s));
      container.innerHTML = '';
      if (widget) {
        widget.cleanup();
        widget = null;
      }
    };
  }, []);

  return <div ref={chatRef} />;
}

