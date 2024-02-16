import { IoMdInformationCircle } from "react-icons/io";
import { Link, useNavigate } from 'react-router-dom';
import profile from '../../public/pfp-default.jpg'
import { RoomInfo } from "../types";

type PrivateRoomHeaderProps = {
    roomInfo: Array<RoomInfo>
}

const PrivateRoomHeader = ({ roomInfo }: PrivateRoomHeaderProps) => {
  const navigate = useNavigate()
  
  return (
    <section className='flex justify-between shadow-xl max-h-[12.5%] py-2 items-center px-4 border-b-2 border-purpleFour'>
        <div className='flex items-center gap-3'>
            <div className='relative w-12 h-12 rounded-full shrink-0 grow-0'>
                <img onClick={() => navigate(`/profile/${roomInfo[0].userId}`)} alt="profile picture" src={roomInfo[0].userProfilePicture || profile} className='absolute object-cover w-full h-full rounded-full'></img>
            </div>
            <article>
                <p className='text-lg font-bold'>{roomInfo[0].username}</p>
                <span className='capitalize'>{roomInfo[0].userStatus}</span>
                <span className={`inline-block w-2 h-2 ml-2 rounded-full ${roomInfo[0].userStatus === 'online' ? 'bg-purpleFour' : 'bg-red-600' }`}></span>
            </article>
        </div>
        <div className='flex items-center gap-3 text-2xl'>
            <Link to={`/profile/${roomInfo[0].userId}`} className='cursor-pointer'><IoMdInformationCircle/></Link>
        </div>
    </section>
  )
}

export default PrivateRoomHeader