'use strict';

if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;

  sw.register('/sw.js').then(
    reg => console.log('worker registered', reg)
  );

  sw.addEventListener('controllerchange', event => {
    console.log('worker controller changed');
  });

  addEventListener('online', event => {
    console.log('browser is online');
  });

  addEventListener('offline', event => {
    console.log('browser is offline');
  });
}
