import React from 'react'
import { regSw, subscribe } from '../registerSW';

type Props = {
    modalRef: React.RefObject<HTMLDialogElement>
}

const EnableNotifications = ({ modalRef }: Props) => {
  
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') return true
      return false
    }
    return false;
  };

  const registerAndSubscribe = async () => {
    try {
      modalRef.current?.close()
      const registeredSW = await regSw();
      const permissionGranted = await requestNotificationPermission();
  
      if (permissionGranted === true) {
        await subscribe(registeredSW);
      }
      
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <dialog ref={modalRef} className='p-4 w-[90%] text-sm sm:w-96 bg-[#252837] text-white rounded-lg'>
        <h2 className='mb-4 text-3xl font-bold'>Important :</h2>
        <p className='mb-4'>We recommend enabling notifications to ensure you're up to date with the latest messages.</p>
        <button onClick={registerAndSubscribe} className='px-4 py-1 rounded-md bg-purpleFour hover:bg-purpleHover focus:outline-purpleThree'>Enable</button>
        <button onClick={() => modalRef.current?.close()} className='px-4 py-1 ml-2 bg-gray-500 rounded-md hover:bg-gray-600'>Don't enable</button>
    </dialog>
  )
}

export default EnableNotifications