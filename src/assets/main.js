'use strict';

if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;
  const ls = localStorage;
  const messageActions = new Map([
    ['storeAssetHash', () => ls.setItem('assetHash', assetHash)],
    [undefined, () => null]
  ]);

  sw.register('/sw.js').then(reg => {
    // console.log('worker registered', reg);
  });

  sw.addEventListener('controllerchange', event => {
    // console.log('worker controller changed');
  });

  sw.addEventListener('message', event => {
    const {action, payload} = event.data;
    const command = messageActions.get(action);
    command(payload);
  });

  addEventListener('online', event => {
    console.log('browser is online');
  });

  addEventListener('offline', event => {
    console.log('browser is offline');
  });

  addEventListener('load', event => {
    if (ls.getItem('assetHash') !== assetHash && sw.controller) {
      sw.controller.postMessage({
        action: 'updateAssets',
        payload: '/rev-manifest.json'
      });
    }
  });
}
