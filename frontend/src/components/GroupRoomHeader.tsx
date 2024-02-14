import { IoMdInformationCircle, IoMdPersonAdd } from "react-icons/io";
import { Link } from 'react-router-dom';
import profile from '../../public/pfp-default.jpg'
import { RxExit } from "react-icons/rx";
import { useRef } from "react";
import AddToGroupModal from "./AddToGroupModal";
import ExitGroupModal from "./ExitGroupModal";
import { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "../App";

type RoomInfo = {
    roomId: number
    groupName: string
    groupProfilePicture: string
    username: string
}

type GroupRoomHeaderProps = {
    roomInfo: Array<RoomInfo>  
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;  
}

const GroupRoomHeader = ({ roomInfo, socket }: GroupRoomHeaderProps) => { 
    const addToGroupModalRef = useRef<HTMLDialogElement>(null)
    const exitGroupModalRef = useRef<HTMLDialogElement>(null)
    
  return (
    <section className='flex justify-between shadow-xl max-h-[12.5%] py-2 items-center px-4 border-b-2 border-purpleFour'>
        <div className='flex items-center w-2/3 gap-3 md:w-3/4'>
            <div className='relative w-12 h-12 rounded-full shrink-0 grow-0'>
                <img src={roomInfo[0].groupProfilePicture || profile} className='absolute object-cover w-full h-full rounded-full'></img>
            </div>
            <div>
                <p className='text-lg font-bold line-clamp-1'>{roomInfo[0].groupName}</p>
                <span className="text-sm break-all line-clamp-1">{roomInfo.map((member, index) => roomInfo.length - 1 !== index ? `${member.username}, ` : member.username)}</span>
            </div>
        </div>
        <div className='flex items-center gap-4 text-xl md:text-2xl'>
            <button onClick={() => addToGroupModalRef.current?.showModal()}><IoMdPersonAdd className='cursor-pointer hover:text-green-400'/></button>
            <Link to={`/${roomInfo[0].roomId}/info`} className='cursor-pointer hover:text-purpleFour'><IoMdInformationCircle/></Link>
            <button onClick={() => exitGroupModalRef.current?.showModal()}><RxExit className='cursor-pointer hover:text-red-600'/></button>
        </div>
        <AddToGroupModal modalRef={addToGroupModalRef} socket={socket}/>
        <ExitGroupModal modalRef={exitGroupModalRef}/>
    </section>
  )
}

export default GroupRoomHeader