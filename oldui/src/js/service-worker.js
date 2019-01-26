const cacheName = 'thin-gbfs';
self.addEventListener('fetch', event => {
    const request = event.request;
    const requestURL = new URL(request.url);
    if (requestURL.origin == location.origin) {
        event.respondWith(
            caches.open(cacheName).then(cache => {
                return fetch(request).then(netResponse => {
                    cache.put(request, netResponse.clone());
                    return netResponse;
                }).catch(() => cache.match(request));
            })
        );
    }
});
