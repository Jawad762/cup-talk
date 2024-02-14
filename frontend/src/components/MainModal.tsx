import { useSearchParams } from 'react-router-dom'
import ModalMessageTab from './ModalMessageTab'
import ModalGroupTab from './ModalGroupTab'
import { useState } from 'react'
import { Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from '../App'

type Props = {
  modalRef: React.RefObject<HTMLDialogElement>
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
}

const CreateGroupModal = ({ modalRef, socket }: Props) => {
    
    const [searchParams, setSearchParams] = useSearchParams()
    const currentTab = searchParams.get('tab') || 'message'
    const [isGroupFormSubmitted, setIsGroupFormSubmitted] = useState(false)
    const [isMessageFormSubmitted, setIsMessageFormSubmitted] = useState(false)

    if (isGroupFormSubmitted) return (
      <dialog ref={modalRef} className='p-4 text-center text-green-400 shadow-xl text-sm rounded-lg w-72 bg-[#252837]'>
          Group has been created.
      </dialog>
    )

    if (isMessageFormSubmitted) return (
      <dialog ref={modalRef} className='p-4 text-center text-green-400 shadow-xl text-sm rounded-lg w-72 bg-[#252837]'>
          Message has been sent.
      </dialog>
    )
    
  return (
      <dialog ref={modalRef} className="space-y-4 p-4 rounded-lg shadow-xl w-[90%] md:w-96 text-white bg-[#252837]">
          <div className='flex items-center w-full'>
              <button onClick={() => setSearchParams('?tab=message')} className={`w-full pb-1 ${currentTab === 'group' && 'opacity-50'}`}>Compose Message</button>
              <button onClick={() => setSearchParams('?tab=group')}  className={`w-full pb-1 ${currentTab === 'message' && 'opacity-50'}`}>Create Group</button>
          </div>
          {currentTab === 'message' ? <ModalMessageTab setIsFormSubmitted={setIsMessageFormSubmitted} socket={socket} parentRef={modalRef}/> : currentTab === 'group' && <ModalGroupTab setIsFormSubmitted={setIsGroupFormSubmitted} parentRef={modalRef} socket={socket}/>}
      </dialog>
  )
}

export default CreateGroupModal