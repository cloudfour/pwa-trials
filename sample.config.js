const config = {
  /**
   * The cache will be named after this, and any caches not matching this
   * will be deleted during activation.
   */
  name: 'cloudfour@1.0',
  /**
   * Requests must match these path patterns to be handled.
   */
  pathsAllowed: [
    '//localhost',
    '//cloudfour.com',
    '//29comwzoq712ml5vj5gf479x-wpengine.netdna-ssl.com'
  ],
  /**
   * Requests must not match these path patterns to be handled.
   */
  pathsIgnored: [
    '/wp-admin',
    '/wp-login.php',
    'preview=true'
  ],
  /**
   * Matching requests will be fulfilled from the cache before the network.
   */
  pathsAssumed: [
    '/assets/'
  ],
  /**
   * Responses must have content-type headers matching these to be cached.
   */
  typesAllowed: [
    'application/js',
    'application/json',
    'application/pdf',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp',
    'text/css',
    'text/html'
  ],
  /**
   * These will be cached during installation.
   */
  dependencies: [],
  /**
   * These will be served in place of failed requests of the same extension.
   */
  fallbacks: [
    '/assets/blank.png',
    '/assets/blank.jpg',
    '/assets/blank.gif'
  ],
  /**
   * This will be served in place of page requests when offline.
   */
  offlinePage: '/offline/'
};
