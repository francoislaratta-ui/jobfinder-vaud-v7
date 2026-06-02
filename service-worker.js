
/* ==========================================
   JOB FINDER VAUD
   V8.6.2 PREMIUM IA PRO
   Créateur F. Laratta
========================================== */

const CACHE_NAME =
"jobfinder-vaud-v862";

const urlsToCache = [

"/",
"/index.html",
"/offers.json",
"/manifest.json"

];

/* ==========================================
   INSTALL
========================================== */

self.addEventListener(

"install",

event=>{

event.waitUntil(

caches
.open(
CACHE_NAME
)
.then(

cache=>{

return cache.addAll(

urlsToCache

);

}

)

);

self.skipWaiting();

}

);

/* ==========================================
   ACTIVATE
========================================== */

self.addEventListener(

"activate",

event=>{

event.waitUntil(

caches.keys()
.then(

keys=>{

return Promise.all(

keys.map(

key=>{

if(

key !== CACHE_NAME

){

return caches.delete(
key
);

}

}

)

);

}

)

);

self.clients.claim();

}

);

/* ==========================================
   FETCH
========================================== */

self.addEventListener(

"fetch",

event=>{

event.respondWith(

caches.match(
event.request
)
.then(

response=>{

if(response){

return response;

}

return fetch(
event.request
);

}

)

);

}

);

/* ==========================================
   PUSH NOTIFICATIONS
========================================== */

self.addEventListener(

"push",

event=>{

const data =

event.data
? event.data.text()
: "Nouvelle offre disponible";

const options = {

body:data,

icon:"icon-192.png",

badge:"icon-192.png",

vibrate:[
200,
100,
200
],

requireInteraction:false

};

event.waitUntil(

self.registration
.showNotification(

"Job Finder Vaud",

options

)

);

}

);

/* ==========================================
   NOTIFICATION CLICK
========================================== */

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

/* ==========================================
   BACKGROUND SYNC
========================================== */

self.addEventListener(

"sync",

event=>{

if(

event.tag ===
"jobfinder-sync"

){

event.waitUntil(

Promise.resolve()

);

}

}

);

/* ==========================================
   MESSAGE
========================================== */

self.addEventListener(

"message",

event=>{

if(

event.data ===
"SKIP_WAITING"

){

self.skipWaiting();

}

}

);
