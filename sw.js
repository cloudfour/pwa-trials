'use strict';

function cacheAssets (urls) {
  return caches.open('assets')
    .then(cache => cache.addAll(urls))
    .then(() => true)
    .catch(err => {
      console.warn(err);
      return false;
    });
}

function uncacheAssets () {
  return caches.delete('assets')
    .catch(err => console.warn(err));
}

function updateAssets (manifestUrl) {
  return uncacheAssets()
    .then(() => fetch(manifestUrl))
    .then(res => res.json())
    .then(manifest => Object.values(manifest))
    .then(urls => cacheAssets(urls))
    .catch(err => {
      console.warn(err);
      return false;
    });
}

const messageActions = new Map([
  ['updateAssets', updateAssets]
]);

addEventListener('install', event => {
  event.waitUntil(
    uncacheAssets()
      .then(skipWaiting())
  );
});

addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

/**
 * @TODO: implement
 * Inspect event request to determine if it needs handling.
 * Depending on the type of resource requested (image, page, etc.), do something.
 */
addEventListener('fetch', event => { //console.log(`[online: ${navigator.onLine}] fetch ${event.request.url}`);
  //
});

/**
 * @TODO: implement
 * Inspect event message to determine if it needs handling.
 * Depending on the type of message, do something.
 */
addEventListener('message', event => {
  console.log(`message from client (${event.source.id}) received by worker`, event);
  const {action, payload} = event.data;
  const command = messageActions.get(action);

  if (command) {
    command(payload)
      .then(success => {
        return Promise.all([
          clients.get(event.source.id),
          success
        ])
      })
      .then(([client, success]) => client.postMessage(success))
  }
});

/**
 * @TODO: implement
 */
addEventListener('sync', event => {
  //
});
