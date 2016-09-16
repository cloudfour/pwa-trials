'use strict';

class FetchHandler {
  /**
   * Fetch something, cache the response, then return a clone of that response.
   */
  static passThru (request) {
    return fetch(request)
      .then(response => {
        if (response.ok) {
          caches.open(cacheName)
            .then(cache => cache.put(request, response));
          return response.clone();
        } else {
          return response;
        }
      });
  }

  /**
   * Return a cached response, ignoring query strings in its URL.
   */
  static matchFuzzy (request) {
    return caches.match(request, {ignoreSearch: true});
  }

  /**
   * Return a cached response if possible, otherwise fetch it from the
   * network (and also cache the new response).
   */
  static offlineFirst (request) {
    return FetchHandler.matchFuzzy(request)
      .then(response => response || FetchHandler.passThru(request))
  }

  /**
   * Fetch a response from the network if possible, otherwise find and
   * return a cached version.
   */
  static onlineFirst (request) {
    return FetchHandler.passThru(request)
      .then(response => {
        if (!response.ok) throw `Bad response ${response.statusText}`;
        return response;
      })
      .catch(() => FetchHandler.matchFuzzy(request))
  }

  /**
   * Fetch a response from the network and from the cache, and return whichever
   * one resolves first (while also updating the cache with a fresh response).
   */
  static fastest (request) {
    return Promise.race([
      FetchHandler.passThru(request),
      FetchHandler.matchFuzzy(request)
    ]);
  }
}

class Criteria {
  constructor (rules=[]) {
    this.rules = rules;
  }

  getResults (subject) {
    return this.rules
      .map(rule => rule(subject));
  }

  testAny (subject) {
    return this.getResults(subject)
      .some(result => result === true);
  }

  testAll (subject) {
    return this.getResults(subject)
      .every(result => result === true);
  }
}

const version = '0.1.0';
const cacheName = `cloudfour@${version}`;
const manifest = new Request('/rev-manifest.json', {cache: 'no-store'});
const offlinePage = new Request('/offline.html', {cache: 'no-store'});

// const messageActions = new Map([
//   [undefined, () => Promise.reject(null)]
// ]);

const resourceType = Object.freeze({
  image: Symbol('image'),
  script: Symbol('script'),
  stylesheet: Symbol('stylesheet')
});

const resourceTypeKeys = Object.keys(resourceType);

const typesByExtension = new Map([
  ['css', resourceType.stylesheet],
  ['js',  resourceType.script],
  ['gif', resourceType.image],
  ['jpg', resourceType.image],
  ['png', resourceType.image],
  ['svg', resourceType.image]
]);

const extensionKeys = Array.from(typesByExtension.keys());

const extensionsByType = new Map(
  resourceTypeKeys.map(key => [
    resourceType[key],
    extensionKeys.filter(ext =>
      typesByExtension.get(ext) === resourceType[key]
    )
  ])
);

const routesByType = new Map([
  [resourceType.image, FetchHandler.offlineFirst],
  [resourceType.script, FetchHandler.offlineFirst],
  [resourceType.stylesheet, FetchHandler.offlineFirst],
  [undefined, FetchHandler.onlineFirst]
]);

function getExtension (subject) {
  const {pathname} = new URL(subject.url);
  const [extension] = pathname.match(/(?!\.)\w+$/i) || [];
  return extension;
}

function fetchData (request) {
  return fetch(request)
    .then(response => response.json());
}

function deleteCaches (filter) {
  return caches.keys()
    .then(keys => filter ? keys.filter(filter) : keys)
    .then(keys => keys.map(key => caches.delete(key)))
    .then(deletions => Promise.all(deletions));
}

/**
 * Installation event handling
 */
addEventListener('install', event => {
  console.log(event);
  event.waitUntil(
    Promise.all([caches.open(cacheName), fetchData(manifest)])
      .then(([cache, data]) => {
        const urls = Object.values(data);
        urls.push(offlinePage);
        return cache.addAll(urls);
      })
      .then(skipWaiting())
  );
});

/**
 * Activate event handling
 */
addEventListener('activate', event => {
  console.log(event);
  event.waitUntil(
    deleteCaches(name => name !== cacheName)
      .then(clients.claim())
  );
});

/**
 * Fetch event handling
 */
addEventListener('fetch', event => {
  const request = event.request;
  const extension = getExtension(request);
  const type = typesByExtension.get(extension);
  const route = routesByType.get(type);

  const criteria = new Criteria([
    ({referrer}) => referrer.startsWith(registration.scope) || referrer === '',
    ({method}) => method === 'GET'
  ]);

  if (criteria.testAll(request)) {
    const showOffline = !navigator.onLine && request.mode === 'navigate';
    event.preventDefault();
    event.respondWith(
      showOffline ? caches.match(offlinePage) : route(request)
        .then(response => response.ok ? response : new Response())
    );
  }
});

/**
 * Message event handling
 */
addEventListener('message', event => {
  console.log(event);
  clients.get(event.source.id)
    .then(client => client.postMessage(event.data));
});

/**
 * Sync event handling
 */
addEventListener('sync', event => {
  console.log(event);
});
