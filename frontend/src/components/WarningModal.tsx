import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'

type Props = {
  modalRef: React.RefObject<HTMLDialogElement>
}

const WarningModal = ({ modalRef } : Props) => {
  
  const currentUser = useSelector((state: RootState) => state.user.user)
  const strikes = currentUser.strikes
  const strikeImages = ['/find-god.jpg', '/do-it-again.jpg', '/banned.jpg']
  
  return (
    <dialog ref={modalRef} className='p-4 outline-none text-white shadow-xl w-[80%] md:w-1/2 lg:w-1/3 text-sm rounded-lg bg-[#252837]'>
        {strikes === 1 && <p className='pb-2'>You after being warned about inappropriate pictures:</p>}
        <img src={strikeImages[strikes]} className='object-cover w-full' alt='meme images'></img>
        <p className='pt-2'>Strike: {strikes + 1} / 3</p>
    </dialog>
  )
}

export default WarningModal