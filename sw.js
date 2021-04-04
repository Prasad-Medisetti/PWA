const staticCacheName = "site-static-v1";
const dynamicCacheName = "site-dynamic-v1";

const assets = [
	"/",
	"/index.html",
	"/js/app.js",
	"/js/ui.js",
	"/js/materialize.min.js",
	"/css/styles.css",
	"/css/materialize.min.css",
	"/img/dish.png",
	"https://fonts.googleapis.com/icon?family=Material+Icons",
	"/pages/fallback.html",
];

//cache size limit function
const limitCacheSize = (name, size) => {
	caches.open(name).then((cache) => {
		cache.keys().then((keys) => {
			if (keys.length > size) {
				cache.delete(keys[0]).then(limitCacheSize(name, size));
			}
		});
	});
};

//  ServiceWorker install event
self.addEventListener("install", (event) => {
	// console.log("Service Worker has been installed");
	event.waitUntil(
		caches.open(staticCacheName).then((cache) => {
			console.log("Caching shell assets");
			cache.addAll(assets);
		})
	);
});

//  ServiceWorker activate event
self.addEventListener("activate", (event) => {
	// console.log("Service Worker has been activated");
	event.waitUntil(
		caches.keys().then((keys) => {
			// console.log(keys);
			return Promise.all(
				keys
					.filter((key) => key !== staticCacheName && key !== dynamicCacheName)
					.map((key) => caches.delete(key))
			);
		})
	);
});

//  ServiceWorker fetch event
self.addEventListener("fetch", (event) => {
	// console.log("Service Worker Fetch", event);
	event.respondWith(
		caches
			.match(event.request)
			.then((cacheResponse) => {
				return (
					cacheResponse ||
					fetch(event.request).then((fetchResponse) => {
						return caches.open(dynamicCacheName).then((cache) => {
							cache.put(event.request.url, fetchResponse.clone());
							limitCacheSize(dynamicCacheName, 15);
							return fetchResponse;
						});
					})
				);
			})
			.catch(() => {
				if (event.request.url.indexOf(".html") > -1)
					return caches.match("/pages/fallback.html");
			})
	);
});
