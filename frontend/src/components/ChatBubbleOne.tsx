import { useSelector } from "react-redux"
import { MessageType, RoomInfo, User } from "../types"
import { RootState } from "../redux/store"
import { useRef, useState } from "react"
import { IoMdMore } from "react-icons/io"
import { PiChecksBold } from "react-icons/pi";
import DeleteMsgModal from "./DeleteMsgModal"
import { Socket } from "socket.io-client"
import { ClientToServerEvents, ServerToClientEvents } from "../App"
import { formatTime } from "../formatTime"
import OpenImageModal from "./OpenImageModal"
import profile from '../../public/pfp-default.jpg'
import { BsImageFill } from "react-icons/bs"

type ChatBubbleOneProps = {
    message: MessageType
    nextMessage: MessageType
    prevMessage: MessageType
    socket: Socket<ServerToClientEvents, ClientToServerEvents>
    roomInfo: Array<RoomInfo>
}

const ChatBubbleOne = ({ message, nextMessage, prevMessage, socket, roomInfo } : ChatBubbleOneProps) => {
  
    const currentUser: User = useSelector((state: RootState) => state.user.user)
    const divRef = useRef<HTMLDivElement>(null)
    const copiedMessageModalRef = useRef<HTMLDialogElement>(null)
    const deleteMessageModalRef = useRef<HTMLDialogElement>(null)
    const openImageModal = useRef<HTMLDialogElement>(null)
    const [showOptions, setShowOptions] = useState(false)

    const handleCopyText = async () => {
      await navigator.clipboard.writeText(message.text)
      copiedMessageModalRef.current?.showModal()
      setTimeout(() => {
        copiedMessageModalRef.current?.close()
      }, 1000)
      divRef.current?.blur()
    }

    const isMessageRead = (): boolean => {
      for (let i = 0; i < roomInfo.length; i++) {
        if (!message.seenBy?.includes(roomInfo[i].userId)) return false
      }
      return true
    }

  return (
    <article id={message.messageId.toString()} key={message.messageId} className={`flex gap-3 w-fit max-w-[75%] items-center flex-row-reverse ml-auto last-of-type:mb-0 ${prevMessage?.senderId === currentUser.userId && 'mr-[2.75rem]'} ${nextMessage?.senderId === currentUser.userId || nextMessage?.senderId === null ? 'mb-0.5': 'mb-4'}`}>
      
        {prevMessage?.senderId !== currentUser.userId && (
        <div className='relative w-8 h-8 rounded-full shrink-0 grow-0'>
          <img alt='profile-picture' src={currentUser.profilePicture || profile} className='absolute object-cover w-full h-full rounded-full'></img>
        </div>
        )}
        
        <div className={`px-2 py-2 min-w-28 rounded-xl text-white bg-purpleFour`}>
          {Boolean(message.isDeleted) === false ? 
          <>
          {message.parentId && (
            <div onClick={() => document.getElementById(message.parentId.toString())?.scrollIntoView()} className="flex items-center justify-between gap-10 px-2 py-1 my-1 text-xs border-l-4 rounded-md cursor-pointer bg-purpleHover border-purpleDark">
              <div>
                <p className="text-purpleDark">{message.parentUsername}</p>
                <p className="break-words line-clamp-1">{message.parentText}</p>
                {message.parentImage && !message.parentText && <BsImageFill/>}
              </div>
              {message.parentImage && <img alt='message-image' className="object-cover w-10 h-10 rounded-md" src={message.parentImage}></img>}
            </div>          
          )}
          {message.image && <img alt='message-image' src={message.image} onClick={() => openImageModal.current?.showModal()} className="my-1 rounded-lg cursor-pointer"/>}
          <p className="break-words">{message.text}</p> 
          <div className="flex items-center gap-2">
            <p className='text-[0.5rem] text-slate-300 ml-auto'>{formatTime(message.date)}</p>
            <PiChecksBold className={`${isMessageRead() === true && 'text-green-400'}`}/>
          </div>
          </>
          : <p className="italic break-all text-slate-300">This message was deleted.</p>}
        </div>

        {Boolean(message.isDeleted) === false && (
        <div onClick={() => setShowOptions(true)} onBlur={() => setTimeout(() => {setShowOptions(false)}, 100)} className="relative">
          
          <button className="inline-flex items-center self-center p-2 font-medium text-center rounded-lg hover:bg-gray-800 focus:ring-2 focus:outline-none dark:text-white focus:ring-gray-50" type="button">
            <IoMdMore/>
          </button>
          
          <div className={`absolute z-10 w-40 left-0 bg-white divide-y divide-gray-100 rounded-lg shadow top-1/2 ${showOptions ? 'block' : 'hidden'}`}>
              <ul className="py-2 text-sm text-gray-700 ">
                <li>
                    <button onClick={handleCopyText} className="block w-full px-4 py-2 text-left hover:bg-gray-100">Copy</button>
                </li>
                <li>
                    <button className="block w-full px-4 py-2 text-left hover:bg-gray-100" onClick={() => {
                      divRef.current?.blur()
                      deleteMessageModalRef.current?.showModal()
                    }}>
                      Delete
                    </button>
                </li>
              </ul>
          </div>
          
        </div>
        )}

        <dialog ref={copiedMessageModalRef} className='space-y-4 p-4 text-center text-green-400 shadow-xl text-sm rounded-lg w-[80%] md:w-72 bg-[#252837]'>
          Copied to clipboard.
        </dialog>

        <DeleteMsgModal selectedMessageId={message.messageId} modalRef={deleteMessageModalRef} socket={socket}/>
        <OpenImageModal imageSrc={message.image} modalRef={openImageModal}/>
        
    </article>
  )
}

export default ChatBubbleOne