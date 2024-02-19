import { useParams } from 'react-router-dom';
import { ImAttachment } from "react-icons/im";
import { IoSend } from "react-icons/io5";
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { User } from '../types';
import AxiosInstance from '../Axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ChatBubbleOne from './ChatBubbleOne';
import ChatBubbleTwo from './ChatBubbleTwo';
import { MessageType } from '../types';
import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../App';
import PrivateRoomHeader from './PrivateRoomHeader';
import GroupRoomHeader from './GroupRoomHeader';
import TypingAnimation from './TypingAnimation';
import { getCurrentTimestamp } from '../formatTime';
import WarningModal from './WarningModal';
import { addStrikes, logout } from '../redux/userSlice';
import LoadingSpinner from './LoadingSpinner';
import { uploadImageToFirebase } from '../uploadImageToFirebase';
import { BsImageFill } from 'react-icons/bs';

interface SocketProp {
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}

const Conversation = ({ socket }: SocketProp) => {

    const axios = AxiosInstance()
    const currentUser: User = useSelector((state: RootState) => state.user.user, shallowEqual)
    const [messageText, setMessageText] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [currentImage, setCurrentImage] = useState<null | string>(null)
    const [imageLoading, setImageLoading] = useState(false)
    const [replyMessage, setReplyMessage] = useState<MessageType | null>(null)
    const { id } = useParams()
    const queryClient = useQueryClient()
    const scrollBottomRef = useRef<HTMLDivElement>(null)
    const convoRef = useRef(null)
    const warningModalRef = useRef<HTMLDialogElement>(null)
    const dispatch = useDispatch()

    const findRoomInfo = async () => {
        const res = await axios.get(`/api/user/find/${id}/${currentUser.userId}`)
        return res.data
    }

    const getMessages = async () => {
        const res = await axios.get(`/api/message/${id}`)
        return res.data
    }

    const sendMessage = async () => {
        if (messageText.length === 0 && currentImage === null) return
        
        if (messages.length > 0) {
            queryClient.setQueryData(['messages', id], (prevMessages: Array<MessageType>) => {
                const newMessage = { senderId: currentUser.userId, roomId: id, text: messageText, image: currentImage, date: getCurrentTimestamp(), messageId: prevMessages[prevMessages.length - 1].messageId + 1, parentId: replyMessage?.messageId, parentUsername: replyMessage?.username, parentText: replyMessage?.text, parentImage: replyMessage?.image }
                return [...prevMessages, newMessage]
            }) 
        }
        
        setMessageText('')
        setCurrentImage(null)
        setReplyMessage(null)
        
        await axios.post('/api/message/create', { senderId: currentUser.userId, roomId: id, text: messageText, image: currentImage, parentId: replyMessage?.messageId }),
        socket.emit('sendMessage')
        await axios.post('/api/user/sendNotification', { title: `${currentUser.username} sent you a new message!`, description: messageText, roomId: id })
    }

    const updateSeenStatus = async () => {
        try {
            await axios.put(`/api/message/updateStatus/${id}/${currentUser.userId}`)
            queryClient.invalidateQueries({ queryKey: ['rooms'] })
            socket.emit('messageStatusChange', id)
        } catch (error) {
            console.error(error)
        }
    }

    const banUser = async () => {
        try {
            await axios.delete(`/api/user/ban/${currentUser.userId}`, { withCredentials: true })
            dispatch(logout())
            await axios.post('/api/auth/signout', {}, { withCredentials: true })
        } catch (error) {
            console.error(error)
        }
    }

    const addUserStrikes = async () => {
        warningModalRef.current?.showModal()
        setTimeout(() => {
            warningModalRef.current?.close()
            dispatch(addStrikes())
        }, 4000)
        await axios.put(`/api/user/strike/${currentUser.userId}`)
    }
    
    const { data: messages } = useQuery({ queryKey: ['messages', id], queryFn: getMessages })

    const { data: roomInfo } = useQuery({ queryKey: ['roomInfo', id], queryFn: findRoomInfo })

    // to handle cases where the current user is the only member of a group and we cant filter through him
    const roomInfoWithoutCurrentUser = roomInfo?.length >= 2 ?
     roomInfo?.filter((member: any) => member.userId !== currentUser.userId)
     : roomInfo
    
    const sendMessageMutation = useMutation({
        mutationFn: sendMessage,
        onSuccess: () => {
          // invalidating the queries because setQueryData isn't working when there are no messages in the room yet
          queryClient.invalidateQueries({ queryKey: ['messages', id] })
          queryClient.invalidateQueries({ queryKey: ['rooms'] })
          scrollBottomRef.current?.scrollIntoView()
        },
      })

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        sendMessageMutation.mutate()
    }
    
    const messagesWithNextAndPrevious = messages?.map((message: MessageType, index: number) => ({
        ...message,
        nextMessage: messages[index + 1] || null,
        prevMessage: messages[index - 1] || null
      }));

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageLoading(true)
        const res = await uploadImageToFirebase(e.target.files?.[0] as File, 'messages/')
        if (res === 'rejected') addUserStrikes()
        else setCurrentImage(res)
        setImageLoading(false)
        e.target.value = ''
    }

    useEffect(() => {
        socket.emit('joinRoom', id);
        
        socket.on('receivedMessage', () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] })
            scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        })

        socket.on('typing', () => {
            setIsTyping(true)
        })

        socket.on('stopTyping', () => {
            setIsTyping(false)
        })

        socket.on('userStatusChange', () => {
            queryClient.invalidateQueries({ queryKey: ['roomInfo', id] })
        })

        socket.on('messageStatusChange', () => {
            queryClient.invalidateQueries({ queryKey: ['messages', id] })
            queryClient.invalidateQueries({ queryKey: ['rooms'] })
        })
        
        return () => {
            socket.emit('leaveRoom', id);
        };
    },[])

    useEffect(() => {
        if (document.visibilityState === 'visible' && messages?.filter((message:MessageType) => message.senderId !== currentUser.userId).every((message: MessageType) => message.seenBy?.includes(currentUser.userId as number)) === false) {
            updateSeenStatus()
        }
    }, [messages])
      
    useEffect(() => {
        scrollBottomRef.current?.scrollIntoView()
    }, [messages, isTyping])
    
    useEffect(() => {
        messageText.length === 0 ? socket.emit('stopTyping', id) : socket.emit('typing', id)
    
        const timeout = setTimeout(() => {
            socket.emit('stopTyping', id);
        }, 3000);
    
        return () => clearTimeout(timeout);
    }, [messageText]);

    useEffect(() => {
        if (currentUser.strikes > 2) banUser() 
    }, [currentUser.strikes])

    useEffect(() => {
       return () => setReplyMessage(null) 
    }, [id])

    if (!roomInfo) return (
        <div className='flex justify-center w-full pt-16'>
            <LoadingSpinner/>
        </div>
    )
          
  return (
        <section ref={convoRef} className="w-full h-full max-h-screen flex flex-col text-white _bg-pattern-2 md:bg-transparent xl:max-w-[60%] pb-12 md:pb-0 xl:mx-10">
            
            {roomInfo[0].roomType === 'private' ?
              <PrivateRoomHeader roomInfo={roomInfoWithoutCurrentUser}/>
            : <GroupRoomHeader roomInfo={roomInfo} socket={socket}/>
            }

            <section id='conversation' className='h-full px-3 py-6 overflow-y-auto xl:px-6'>
            {messagesWithNextAndPrevious?.map((message: MessageType) => (
                message.senderId === currentUser.userId ?
                    <ChatBubbleOne key={message.messageId} message={message} nextMessage={message.nextMessage} prevMessage={message.prevMessage} socket={socket} roomInfo={roomInfoWithoutCurrentUser}/> 
                    : 
                    <ChatBubbleTwo key={message.messageId} message={message} setReplyMessage={setReplyMessage} nextMessage={message.nextMessage} prevMessage={message.prevMessage}/>
            ))}
                {isTyping && <TypingAnimation/>}
                <div ref={scrollBottomRef} className='w-1 h-1'></div>
            </section>
            
            
            <form onSubmit={handleFormSubmit} className='flex relative items-center mt-auto gap-4 px-3 py-4 max-h-[12.5%] border-t-2 border-purpleFour xl:px-6'>
                <div className={`absolute bg-[#252837] flex items-center justify-between rounded-md border-l-4 border-purpleFour -top-1 text-center transition-all ease-in-out -translate-y-full ${replyMessage ? 'h-14 p-2 inset-x-1' : 'h-0 overflow-hidden'}`}>
                    <div>
                        <p className='text-sm text-left'>Replying to <span className='text-purpleFour'>{replyMessage?.username}:</span></p>
                        <p className='text-sm text-left line-clamp-1'>{replyMessage?.text}</p>
                        {replyMessage?.image && !replyMessage.text && <BsImageFill/>}  
                    </div>
                    <button type='button' onClick={() => setReplyMessage(null)} className='mr-2 hover:text-red-600'>&#x2716;</button>
                </div>
                <div>
                    <label htmlFor='image'><ImAttachment className='text-2xl cursor-pointer'/></label>
                    <input onChange={handleImageUpload} id='image' name='image' type='file' className='hidden'/>
                </div>
                {currentImage ? <img src={currentImage} alt='message-image' className='w-8 h-8'/> : imageLoading && <LoadingSpinner/>}
                <input value={messageText} onChange={(e) => setMessageText(e.target.value)} className='w-full bg-transparent outline-none' maxLength={200} placeholder='Type your message here...'></input>
                <button type='submit'><IoSend className='text-2xl cursor-pointer'/></button>
            </form>

            <WarningModal modalRef={warningModalRef}/>

        </section>
  )
}

export default Conversation
