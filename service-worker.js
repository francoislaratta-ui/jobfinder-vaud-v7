const CACHE_NAME =
"jobfinder-v13-premium-v1";

const ASSETS = [

"/",

"/index.html",

"/manifest.json",

"/offers.json",

"/icon-192.png",

"/icon-512.png"

];

/* ==========================
   INSTALL
========================== */

self.addEventListener(
"install",
event=>{

self.skipWaiting();

event.waitUntil(

caches.open(
CACHE_NAME
)
.then(cache=>{

return cache.addAll(
ASSETS
);

})

);

}
);

/* ==========================
   ACTIVATE
========================== */

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

/* ==========================
   FETCH
========================== */

self.addEventListener(
"fetch",
event=>{

event.respondWith(

fetch(
event.request
)

.then(response=>{

const copy =
response.clone();

caches.open(
CACHE_NAME
)
.then(cache=>{

cache.put(
event.request,
copy
);

});

return response;

})

.catch(()=>{

return caches.match(
event.request
);

})

);

}
);

/* ==========================
   MESSAGE
========================== */

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

/* ==========================
   PUSH
========================== */

self.addEventListener(
"push",
event=>{

const options = {

body:

event.data
?

event.data.text()

:

"Nouvelle notification",

icon:
"/icon-192.png",

badge:
"/icon-192.png"

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

/* ==========================
   NOTIFICATION CLICK
========================== */

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
