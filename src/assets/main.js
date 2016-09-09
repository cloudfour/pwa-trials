'use strict';

if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;
  const storedAssetHash = localStorage.getItem('assetHash');

  sw.register('/sw.js').then(reg => {
    console.log('worker registered', reg);
  });

  sw.addEventListener('controllerchange', event => {
    console.log('worker controller changed');
  });

  sw.addEventListener('message', event => {
    console.log('message from worker received by client', event);
  });

  addEventListener('online', event => {
    console.log('browser is online');
  });

  addEventListener('offline', event => {
    console.log('browser is offline');
  });

  addEventListener('load', event => {
    if (storedAssetHash !== assetHash) {
      console.log('assets are stale');
      sw.controller.postMessage({
        action: 'updateAssets',
        payload: '/assets/rev-manifest.json'
      });
    }
  });
}
