import { useQuery, useQueryClient } from '@tanstack/react-query';
import profile from '../../public/pfp-default.jpg'
import logo from '../../public/logo.svg'
import { useNavigate, useParams } from 'react-router-dom';
import { User } from '../types';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import AxiosInstance from '../Axios'
import { BsFillImageFill } from "react-icons/bs";
import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../App';
import MainModal from './MainModal';
import { formatTime } from '../formatTime';
import LoadingSpinner from './LoadingSpinner';

interface SocketProp {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}

export type roomType = {
  roomId: number;
  type: string;
  name: string;
  usernames: Array<string>;
  userProfilePicture: string;
  groupProfilePicture: string;
  lastMessageDate: Date;
  lastMessageText: string;
  lastMessageImage: string;
  lastMessageSeenBy: number[];
  lastMessageSenderId: number;
  lastMessageIsDeleted: boolean;
};

const Conversations = ({ socket }: SocketProp) => {
  
  const axios = AxiosInstance()
  const { id } = useParams()
  const currentUser: User = useSelector((state: RootState) => state.user.user)
  const [searchText, setSearchText] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const modalRef = useRef<HTMLDialogElement>(null)

  const getUserRooms = async () => {
    try {
      const res = await axios.get(`/api/room/get/${currentUser.userId}`, { withCredentials: true })
      return res.data
    } catch (error) {
      console.error(error)
    }
  }

  const { data: rooms } = useQuery({ queryKey: ['rooms'], queryFn: getUserRooms })

  useEffect(() => {
    socket.on('receivedMessage', () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    })

    socket.on('deletedMessage', () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    })

    socket.on('messageStatusChange', () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    })

    socket.on('addedToGroup', () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    })

    return () => {
      socket.off('receivedMessage');
      socket.off('deletedMessage');
      socket.off('messageStatusChange');
  };
  },[])

  if (!rooms) return (
    <div className={`flex justify-center w-full md:max-w-[70%] lg:max-w-[50%] xl:max-w-[30%] pt-16 ${id && 'hidden'}`}>
      <LoadingSpinner/>
    </div>    
  )

  return (
    <section id='conversations' className={`w-full max-h-full overflow-x-hidden _bg-pattern-2 md:max-w-[70%] lg:max-w-[50%] xl:max-w-[30%] flex flex-col rounded-r-xl text-white ${id && 'hidden xl:block'}`}>

        <img src={logo} alt='logo' className='mx-auto h-28 w-28 md:hidden'></img>

        <div>
          <div className="flex items-center gap-3 px-6 md:py-6 md:mt-0">
              <input onChange={(e) => setSearchText(e.target.value)} className="w-full px-3 py-2 text-white bg-transparent border-2 rounded-full outline-none border-[#d6d8df]" placeholder="Search Conversations"></input>
              <button onClick={() => modalRef.current?.showModal()} className="w-10 h-8 text-xl rounded-full bg-[#d6d8df] text-purpleFour">+</button>
          </div>

          <span className="inline-block px-6 pt-3 pr-2">Recent</span>
          <span>&#8628;</span>
        </div>

        {rooms?.length === 0 && <p className='mx-auto mt-10'>Click the + to connect with people!</p>}
        
        <div className='flex-grow pb-12 mr-2 md:pb-4'>
        {rooms?.filter((room:roomType) => room.usernames?.[0].toLowerCase().includes(searchText.toLowerCase()) || room.name?.toLowerCase().includes(searchText.toLowerCase()))
        .map((room: roomType) => (
            <div onClick={() => navigate(`/${room.roomId}`)} key={room.roomId} className={`flex items-center px-2 py-3 ml-4 mt-3 gap-3 rounded-xl cursor-pointer hover:bg-purpleFour relative ${room.roomId === Number(id) && 'bg-purpleFour'}`}>
                <div className='relative w-12 h-12 rounded-full shrink-0 grow-0'>
                    <img alt='profile-picture' src={room.type === 'private' ? room.userProfilePicture || profile : room.groupProfilePicture || profile} className='absolute object-cover w-full h-full rounded-full'></img>
                </div>
                <article className='w-full pr-4'>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white line-clamp-1">{room.name || room.usernames?.[0]}</p>
                    <span className="text-sm">{formatTime(room.lastMessageDate)}</span>
                  </div>
                  <div className={`text-sm flex items-center break-all opacity-75 ${Boolean(room.lastMessageIsDeleted) === true && 'italic'}`}>
                    <p className='line-clamp-1 max-w-[95%] pr-2'>{Boolean(room.lastMessageIsDeleted) === true ? 'This message was deleted' : room.lastMessageText ? room.lastMessageText : room.lastMessageImage && <BsFillImageFill/>}</p>
                    {(room.lastMessageSenderId !== currentUser.userId && !room.lastMessageSeenBy?.includes(currentUser.userId as number)) && <span className='inline-block w-2 h-2 rounded-full bg-purpleFour'></span>}
                  </div>
                </article>
            </div>
        ))}
        </div>

        <MainModal modalRef={modalRef} socket={socket}/>

    </section>
  )
}

export default Conversations