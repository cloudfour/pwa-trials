'use strict';

if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;

  sw.register('/sw.js');

  window.sendFormData = function (form) {
    const formData = new FormData(form);
    sw.controller.postMessage(formData.get('msg'));
  };

  // Debug logging

  ['controllerchange', 'message'].forEach(type => {
    sw.addEventListener(type, console.log.bind(console));
  });

  ['online', 'offline'].forEach(type => {
    addEventListener(type, console.log.bind(console));
  });
}
