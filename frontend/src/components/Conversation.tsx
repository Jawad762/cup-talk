import { useParams } from 'react-router-dom';
import { ImAttachment } from "react-icons/im";
import { IoSend } from "react-icons/io5";
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { RoomInfo, User } from '../types';
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
import { roomType } from './Conversations';

interface SocketProp {
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}

const Conversation = ({ socket }: SocketProp) => {

    const axios = AxiosInstance()
    const currentUser: User = useSelector((state: RootState) => state.user.user, shallowEqual)
    const [isTyping, setIsTyping] = useState(false)
    const [currentImage, setCurrentImage] = useState<null | string>(null)
    const [imageLoading, setImageLoading] = useState(false)
    const [replyMessage, setReplyMessage] = useState<MessageType | null>(null)
    const { id } = useParams()
    const queryClient = useQueryClient()
    const scrollBottomRef = useRef<HTMLDivElement>(null)
    const convoRef = useRef(null)
    const warningModalRef = useRef<HTMLDialogElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dispatch = useDispatch()

    const findRoomInfo = async () => {
        const res = await axios.get(`/api/user/find/${id}/${currentUser.userId}/20`)
        return res.data
    }

    const getMessages = async () => {
        const res = await axios.get(`/api/message/${id}`)
        return res.data
    }

    const sendMessage = async (messageText: string) => {
        if (messageText.length === 0 && currentImage === null) return
        
        const messages: MessageType[] = queryClient.getQueryData(['messages', id]) as MessageType[]
        const lastMessageId = messages.length > 0 ? messages[messages.length - 1].messageId : Math.floor(Math.random() * 50000)
        const newMessage = { senderId: currentUser.userId, username: currentUser.username, userProfilePicture: currentUser.profilePicture, roomId: id, text: messageText, image: currentImage, date: getCurrentTimestamp(), messageId: lastMessageId + 1, parentId: replyMessage?.messageId, parentUsername: replyMessage?.username, parentText: replyMessage?.text, parentImage: replyMessage?.image, seenBy: [], isDeleted: 0, nextMessage: null, prevMessage: null }
        
        queryClient.setQueryData(['messages', id], (prevMessages: Array<any>) => {
            const newMessages = [...prevMessages]
            newMessages.push(newMessage)
            return newMessages
        })
                        
        queryClient.setQueryData(['rooms'], (prevRooms: roomType[]) => {
            const newRooms = prevRooms?.map(room => {
                if (room.roomId === Number(newMessage.roomId)) {
                    return {
                      ...room,
                      lastMessageText: newMessage.text,
                      lastMessageImage: newMessage.image,
                      lastMessageSenderId: newMessage.senderId,
                      lastMessageDate: newMessage.date,
                      lastMessageSeenBy: newMessage.seenBy,
                      lastMessageIsDeleted: newMessage.isDeleted,
                      lastMessageId: newMessage.messageId
                    }
                }
                else return room
            }).sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime())
            
            return newRooms
        })

        const formDOM: HTMLFormElement = document.getElementById('messageForm') as HTMLFormElement
        formDOM.reset()
        setCurrentImage(null)
        setReplyMessage(null)

        socket.emit('sendMessage', newMessage)
        socket.emit('stopTyping', id)
        
        await axios.post('/api/message/create', { senderId: currentUser.userId, roomId: id, text: newMessage.text, image: newMessage.image, parentId: newMessage.parentId })
        await axios.post('/api/user/sendNotification', { title: `${currentUser.username} sent you a new message!`, description: newMessage.text, roomId: id })
    }

    const updateSeenStatus = async () => {
        try {
            queryClient.setQueryData(['rooms'], (prevRooms: roomType[]) => {
                const newRooms = prevRooms?.map(room => {
                    if (room.roomId === Number(id) && room.lastMessageSenderId !== currentUser.userId && Array.isArray(room.lastMessageSeenBy)) {
                        return {
                            ...room,
                            lastMessageSeenBy: [...room.lastMessageSeenBy, currentUser.userId]
                        }
                    }
                    else return room
                })
                return newRooms
            })
            socket.emit('messageStatusChange', id, currentUser.userId as number)
            await axios.put(`/api/message/updateStatus/${id}/${currentUser.userId}`)
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
          scrollBottomRef.current?.scrollIntoView()
        },
      })

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget)
        const messageText = form.get('messageText') as string
        sendMessageMutation.mutate(messageText)
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
        
        socket.on('receivedMessage', (message) => {
            if (id === message.roomId) {
                queryClient.setQueryData(['messages', id], (prevMessages: Array<MessageType>) => {
                    // to prevent duplication issues
                    const doesMessageExist = prevMessages.find(prevMessage => prevMessage.messageId === message.messageId)
                    if (doesMessageExist) return
                    return [...prevMessages, message]
                }) 
                scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
            else return null
        })

        socket.on('typing', () => {
            setIsTyping(true)
        })

        socket.on('stopTyping', () => {
            setIsTyping(false)
        })

        socket.on('userStatusChange', (status) => {
            const roomInfo: RoomInfo[] = queryClient.getQueryData(['roomInfo', id]) as RoomInfo[]
            if (roomInfo && roomInfo[0].roomType === 'private') {
                queryClient.setQueryData(['roomInfo', id], (prevRoomInfo: RoomInfo[]) => {
                    const newRoomInfo = prevRoomInfo.map(roomInfo => {
                        if (roomInfo.userId != currentUser.userId) {
                            return {
                                ...roomInfo,
                                userStatus: status
                            }
                        }
                        return roomInfo
                    })
                    return newRoomInfo
                })
            }
        });
        
        socket.on('messageStatusChange', (seenById) => {
            queryClient.setQueryData(['messages', id], (prevMessages: MessageType[]) => {
                const newMessages = prevMessages?.map((message: MessageType) => {
                    if (message.senderId === currentUser.userId && !message.seenBy?.includes(seenById)) {
                        return {
                            ...message,
                            seenBy: Array.isArray(message.seenBy) && message.seenBy.length > 0 ? [...message.seenBy, seenById] : [seenById]
                        }
                    }
                    else return message
                })
                return newMessages
            })
        })        

        socket.on('deletedMessage', (message) => {
            queryClient.setQueryData(['messages', id], (prevMessages: MessageType[]) => {
              const newMessages = prevMessages?.map((prevMessage: MessageType) => {
                if (prevMessage.messageId === message.messageId) {
                  return {
                    ...message,
                    isDeleted: 1,
                  }
                }
                else return prevMessage
              })
              return newMessages
            })
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const messageText = e.target.value;
    
        messageText.length === 0 ? socket.emit('stopTyping', id) : socket.emit('typing', id);
    
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    
        timeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping', id);
        }, 3000);
    };

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
            
            <form id='messageForm' onSubmit={handleFormSubmit} className='flex relative items-center mt-auto gap-4 px-3 py-4 max-h-[12.5%] border-t-2 border-purpleFour xl:px-6'>
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
                <input name='messageText' onChange={handleInputChange} className='w-full bg-transparent outline-none' maxLength={200} placeholder='Type your message here...'></input>
                <button type='submit'><IoSend className='text-2xl cursor-pointer'/></button>
            </form>

            <WarningModal modalRef={warningModalRef}/>

        </section>
  )
}

export default Conversation