import { formatTime } from "../formatTime"
import { MessageType } from "../types"
import OpenImageModal from "./OpenImageModal"
import { useRef } from "react"
import profile from '../../public/pfp-default.jpg'


type ChatBubbleTwoProps = {
    message: MessageType
    nextMessage: MessageType
    prevMessage: MessageType
}

const ChatBubbleTwo = ({ message, nextMessage, prevMessage } : ChatBubbleTwoProps) => {

  const modalRef = useRef<HTMLDialogElement>(null)

  return (
    <article key={message.messageId} className={`flex items-center gap-3 max-w-[75%] last-of-type:mb-0 ${prevMessage?.senderId === message.senderId && 'ml-[2.75rem]'} ${nextMessage?.senderId !== message.senderId ? 'mb-4': 'mb-0.5'}`}>
      
        {prevMessage?.senderId !== message.senderId && (
        <div className='relative w-8 h-8 rounded-full shrink-0 grow-0'>
          <img src={message.userProfilePicture || profile} className='absolute object-cover w-full h-full rounded-full'></img>
        </div>
        )}
        
        <div className={`py-1 px-2 rounded-xl text-black bg-[#d6d8df] min-w-24`}>
          <h5 className="text-[0.7rem] text-purpleFour">{message.username}</h5>
          {Boolean(message.isDeleted) === false ? (
            <div>
              <p className="break-all">{message.text}</p>
              {message.image && <img src={message.image} className="my-2 rounded-lg cursor-pointer" onClick={() => modalRef.current?.showModal()}/>}
              <p className={`text-[0.5rem] text-end`}>{formatTime(message.date)}</p>
            </div>
          ) : (
            <p className="italic break-all text-slate-500">This message was deleted.</p>
          )}
        </div>

        <OpenImageModal imageSrc={message.image} modalRef={modalRef}/>
        
    </article>
  )
}

export default ChatBubbleTwo