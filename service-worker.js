
const CACHE_NAME = "jobfinder-vaud-v861";

const urlsToCache = [

"/",
"/index.html",
"/manifest.json",
"/offers.json"

];

/* =========================
   INSTALL
========================= */

self.addEventListener(
"install",
event=>{

event.waitUntil(

caches.open(
CACHE_NAME
)
.then(cache=>{

return cache.addAll(
urlsToCache
);

})

);

self.skipWaiting();

}
);

/* =========================
   ACTIVATE
========================= */

self.addEventListener(
"activate",
event=>{

event.waitUntil(

caches.keys()
.then(keys=>{

return Promise.all(

keys.map(key=>{

if(
key !== CACHE_NAME
){

return caches.delete(
key
);

}

})

);

})

);

self.clients.claim();

}
);

/* =========================
   FETCH
========================= */

self.addEventListener(
"fetch",
event=>{

event.respondWith(

caches.match(
event.request
)
.then(response=>{

return (
response ||
fetch(
event.request
)
);

})

);

}
);

/* =========================
   NOTIFICATIONS
========================= */

self.addEventListener(
"push",
event=>{

const options = {

body:
"Nouvelle offre disponible",

icon:
"/icon-192.png",

badge:
"/icon-192.png",

vibrate:[
200,
100,
200
]

};

event.waitUntil(

self.registration.showNotification(

"Job Finder Vaud",

options

)

);

}
);

/* =========================
   CLICK NOTIFICATION
========================= */

self.addEventListener(
"notificationclick",
event=>{

event.notification.close();

event.waitUntil(

clients.openWindow(
"/"
)

);

}
);
