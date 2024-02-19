this.addEventListener('activate', function (_event) {
  console.log('service worker activated');
});

this.addEventListener('push', async function (event) {
  try {
    const message = await event.data.json();

    const { title, description, image } = message;
    
    await this.registration.showNotification(title, {
      body: description,
      icon: image,
    });

  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

