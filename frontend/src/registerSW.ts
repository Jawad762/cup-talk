import axios from 'axios';

export async function regSw () {
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.register ('/SW.js', { scope: '/' });
    console.log ('service config is', {reg});
    return reg;
  }
  throw Error ('serviceworker not supported');
}

export async function subscribe (serviceWorkerReg: any) {
    let subscription = await serviceWorkerReg.pushManager.getSubscription();

    if (subscription === null) {
      subscription = await serviceWorkerReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BCS7q0kDtcYVVbQva3Kfk2i4pD6p09Nyj-dgM2a8XbSwfWrBNMq3ZWdsqFfesMahYSuKuptIUsY1qvsyWHanweI'
      });
    }
    await axios.post('/api/user/subscribe', { subscription })

    console.log(subscription)
}