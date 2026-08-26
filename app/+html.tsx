import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, shrink-to-fit=no"
        />
        <title>Life Engine v1.0</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: nativeChrome }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const nativeChrome = `
html, body, #root {
  height: 100%;
  background-color: #0A0C10;
  overscroll-behavior: none;
  overflow: hidden;
  touch-action: manipulation;
  -webkit-overflow-scrolling: touch;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif;
}
input, textarea {
  -webkit-user-select: text;
  user-select: text;
}
* {
  -webkit-tap-highlight-color: transparent;
}
*::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
* {
  scrollbar-width: none;
}
`;
