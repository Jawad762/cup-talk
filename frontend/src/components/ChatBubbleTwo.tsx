import { formatTime } from "../formatTime"
import { MessageType } from "../types"
import OpenImageModal from "./OpenImageModal"
import { Dispatch, SetStateAction, useRef, useState } from "react"
import profile from '../../public/pfp-default.jpg'
import { useNavigate } from "react-router-dom"
import { IoMdMore } from "react-icons/io"
import { BsImageFill } from "react-icons/bs"

type ChatBubbleTwoProps = {
    message: MessageType
    nextMessage: MessageType
    prevMessage: MessageType
    setReplyMessage: Dispatch<SetStateAction<MessageType | null>>
}

const ChatBubbleTwo = ({ message, nextMessage, prevMessage, setReplyMessage } : ChatBubbleTwoProps) => {

  const openImageModal = useRef<HTMLDialogElement>(null)
  const copiedMessageModalRef = useRef<HTMLDialogElement>(null)
  const [showOptions, setShowOptions] = useState(false)
  const navigate = useNavigate()

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(message.text)
    copiedMessageModalRef.current?.showModal()
    setTimeout(() => {
      copiedMessageModalRef.current?.close()
    }, 1000)
  }

  const handleReplyClick = () => {
    setReplyMessage(message)
  }

  return (
    <article id={message.messageId.toString()} key={message.messageId} className={`flex items-center gap-3 max-w-[75%] last-of-type:mb-0 ${prevMessage?.senderId === message.senderId && 'ml-[2.75rem]'} ${nextMessage?.senderId !== message.senderId ? 'mb-4': 'mb-0.5'}`}>
      
        {prevMessage?.senderId !== message.senderId && (
        <div onClick={() => navigate(`/profile/${message.senderId}`)} className='relative w-8 h-8 rounded-full shrink-0 grow-0'>
          <img alt='profile-picture' src={message.userProfilePicture || profile} className='absolute object-cover w-full h-full rounded-full'></img>
        </div>
        )}
        
        <div className={`py-1 px-2 rounded-xl text-black bg-[#d6d8df] min-w-28`}>
          <h5 className="text-[0.7rem] text-purpleFour">{message.username}</h5>
          {Boolean(message.isDeleted) === false ? (
            <div>
              {message.parentId && (
              <div onClick={() => document.getElementById(message.parentId.toString())?.scrollIntoView()} className="flex items-center justify-between gap-10 px-2 py-1 my-1 text-xs text-white bg-gray-400 border-l-4 rounded-md cursor-pointer border-purpleFour">
                <div>
                  <p className="text-purpleFour">{message.parentUsername}</p>
                  <p className="break-words line-clamp-1">{message.parentText}</p>
                  {message.parentImage && !message.parentText && <BsImageFill/>}
                </div>
                {message.parentImage && !message.parentText && <img alt='message-image' className="object-cover w-10 h-10 rounded-md" src={message.parentImage}></img>}
              </div> 
              )}
              {message.image && <img alt='message-image' src={message.image} className="my-1 rounded-lg cursor-pointer" onClick={() => openImageModal.current?.showModal()}/>}
              <p className="break-words">{message.text}</p>
              <p className={`text-[0.5rem] text-end`}>{formatTime(message.date)}</p>
            </div>
          ) : (
            <p className="italic break-all text-slate-500">This message was deleted.</p>
          )}
        </div>

        {Boolean(message.isDeleted) === false && (
        <div onClick={() => setShowOptions(true)} onBlur={() => setTimeout(() => {setShowOptions(false)}, 100)} className="relative">
          
          <button className="inline-flex items-center self-center p-2 font-medium text-center rounded-lg hover:bg-gray-800 focus:ring-2 focus:outline-none dark:text-white focus:ring-gray-50" type="button">
            <IoMdMore/>
          </button>
          
          <div className={`absolute z-10 w-40 bg-white divide-y divide-gray-100 rounded-lg shadow right-0 top-1/2 ${showOptions ? 'block' : 'hidden'}`}>
              <ul className="py-2 text-sm text-gray-700">
                <li>
                    <button onClick={handleCopyText} className="block w-full px-4 py-2 text-left hover:bg-gray-100">Copy</button>
                </li>
                <li>
                    <button className="block w-full px-4 py-2 text-left hover:bg-gray-100" onClick={handleReplyClick}>
                      Reply
                    </button>
                </li>
              </ul>
          </div>
          
        </div>
        )}

        <dialog ref={copiedMessageModalRef} className='space-y-4 p-4 text-center text-green-400 shadow-xl text-sm rounded-lg w-[80%] md:w-72 bg-[#252837]'>
          Copied to clipboard.
        </dialog> 

        <OpenImageModal imageSrc={message.image} modalRef={openImageModal}/>
        
    </article>
  )
}

export default ChatBubbleTwo