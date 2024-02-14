import { useSelector } from "react-redux"
import { MessageType, RoomInfo, User } from "../types"
import { RootState } from "../redux/store"
import { useEffect, useRef, useState } from "react"
import { IoMdMore } from "react-icons/io"
import { PiChecksBold } from "react-icons/pi";
import DeleteMsgModal from "./DeleteMsgModal"
import { Socket } from "socket.io-client"
import { ClientToServerEvents, ServerToClientEvents } from "../App"
import { formatTime } from "../formatTime"
import OpenImageModal from "./OpenImageModal"
import profile from '../../public/pfp-default.jpg'

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
    const moreActionsDiv = useRef<HTMLDivElement>(null)
    const [leftOffset, setLeftOffset] = useState<number>(0)

    const handleCopyText = async () => {
      await navigator.clipboard.writeText(message.text)
      copiedMessageModalRef.current?.showModal()
      setTimeout(() => {
        copiedMessageModalRef.current?.close()
      }, 1000)
      divRef.current?.blur()
    }

    const isMessageRead = (): boolean => {
      if (roomInfo[0].type === 'private') {
        if (message.seenBy[0] === roomInfo[0].userId) {
          return true
        }
        else return false
      }
      
      else {
        for (let i = 0; i < roomInfo.length; i++) {
          if (!message.seenBy?.includes(roomInfo[i].userId)) return false
        }
        return true
      }
    }

    useEffect(() => {
      const rect = moreActionsDiv.current?.getBoundingClientRect()
      setLeftOffset(rect?.left as number + window.scrollX)
    }, [message])

  return (
    <article key={message.messageId} className={`flex gap-3 w-fit max-w-[75%] relative items-center flex-row-reverse ml-auto last-of-type:mb-0 ${prevMessage?.senderId === currentUser.userId && 'mr-[2.75rem]'} ${nextMessage?.senderId === currentUser.userId || nextMessage?.senderId === null ? 'mb-0.5': 'mb-4'}`}>
      
        {prevMessage?.senderId !== currentUser.userId && (
        <div className='relative w-8 h-8 rounded-full shrink-0 grow-0'>
          <img src={currentUser.profilePicture || profile} className='absolute object-cover w-full h-full rounded-full'></img>
        </div>
        )}
        
        <div className={`px-2 py-2 min-w-24 rounded-xl text-white bg-purpleFour`}>
          {Boolean(message.isDeleted) === false ? 
          <>
          <p className="break-all">{message.text}</p> 
          {message.image && <img src={message.image} onClick={() => openImageModal.current?.showModal()} className="my-2 rounded-lg cursor-pointer"/>}
          <div className="flex items-center gap-2">
            <p className='text-[0.5rem] text-slate-300 ml-auto'>{formatTime(message.date)}</p>
            <PiChecksBold className={`${isMessageRead() === true && 'text-green-400'}`}/>
          </div>
          </>
          : <p className="italic break-all text-slate-300">This message was deleted.</p>}
        </div>

        {Boolean(message.isDeleted) === false && (
        <div ref={divRef} tabIndex={0} className="group">
          
          <button className="inline-flex items-center self-center p-2 font-medium text-center rounded-lg hover:bg-gray-800 focus:ring-2 focus:outline-none dark:text-white focus:ring-gray-50" type="button">
            <IoMdMore/>
          </button>
          
          <div ref={moreActionsDiv} style={{ left: leftOffset < 0 ? Math.abs(leftOffset) : 0 }} className={`absolute z-10 w-40 -translate-x-1/2 bg-white divide-y divide-gray-100 rounded-lg shadow top-1/2 invisible group-focus-within:visible`}>
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