'use strict';


/*
TODO:
Intercept <link> fetch for rev-manifest.json
Compare integrity hash from request to one saved in indexedDB
If different, then replace the assets cache and update DB record.
*/


const cacheName = 'default';

const dependencies = new Map([
  ['offlinePage', '/offline.html'],
  ['offlineImage', '/assets/image.gif']
]);

const fallbacks = new Map([
  ['image', dependencies.get('offlineImage')],
  ['page', dependencies.get('offlinePage')]
]);

const messageActions = new Map([
  ['updateAssets', updateAssets],
  [undefined, () => Promise.reject(null)]
]);

const assetRules = new Map([
  ['css', [
    req => req.headers.get('accept').includes('css'),
    req => new URL(req.url).pathname.endsWith('.css')
  ]],
  ['js', [
    req => req.headers.get('accept').includes('javascript'),
    req => new URL(req.url).pathname.endsWith('.js')
  ]],
  ['image', [
    req => /\.(png|gif|jpg|svg)$/.test(req.url)
  ]]
]);

function openCache () {
  return caches.open(cacheName);
}

function deleteCache () {
  return caches.delete(cacheName);
}

function anyPass (rules, subject) {
  return rules
    .map(rule => rule(subject))
    .some(result => result === true);
}

function cacheUrls (urls) {
  return openCache()
    .then(cache => cache.addAll(urls))
    .then(() => true)
    .catch(() => false);
}

function fetchValues (jsonUrl) {
  return fetch(jsonUrl)
    .then(res => res.json())
    .then(json => Object.values(json));
}

function fetchKeep (req) {
  return fetch(req)
    .then(res => {
      if (res.ok) {
        openCache().then(cache => cache.put(req, res));
      }
      return res.clone();
    });
}

function updateAssets (manifestUrl) {
  return fetchValues(manifestUrl)
    .then(urls => cacheUrls(urls))
    .catch(() => false);
}

addEventListener('install', event => {
  event.waitUntil(
    deleteCache()
      .then(cacheUrls(Array.from(dependencies.values())))
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
  const request = event.request;
  const url = new URL(request.url);
  let assetType;

  for (let [type, rules] of assetRules) {
    if (anyPass(rules, request)) {
      assetType = type;
      break;
    }
  }

  if (assetType) {
    event.respondWith(
      caches.match(request)
        .then(res => res || fetchKeep(request))
        .catch(() => caches.match(fallbacks.get(assetType)))
    );
  } else {
    event.respondWith(
      fetchKeep(request)
        .catch(() => caches.match(request))
        .then(res => res || caches.match(fallbacks.get('page')))
    );
  }
});

/**
 * @TODO: implement
 * Inspect event message to determine if it needs handling.
 * Depending on the type of message, do something.
 */
addEventListener('message', event => { console.log(event);
  const {action, payload} = event.data;
  const command = messageActions.get(action);
  command(payload)
    .then(success => {
      return Promise.all([
        clients.get(event.source.id),
        success
      ])
    })
    .then(([client, success]) => client.postMessage({
      action: 'storeAssetHash'
    }))
});

/**
 * @TODO: implement
 */
addEventListener('sync', event => {
  //
});
