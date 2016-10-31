'use strict';

console.log('Executing appshell.js');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
