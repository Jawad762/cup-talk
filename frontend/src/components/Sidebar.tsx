import { LuUser2, LuMessageSquare, LuLogOut, LuSearch } from "react-icons/lu";
import { Link, useLocation, useParams } from "react-router-dom";
import profile from '../../public/pfp-default.jpg'
import axios from 'axios'
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/userSlice";
import { User } from "../types";
import { RootState } from "../redux/store";
import { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../App';

interface SocketProp {
    socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}

const Sidebar = ({ socket }: SocketProp) => {

    const currentUser: User = useSelector((state: RootState) => state.user.user)
    const dispatch = useDispatch()
    const pathname = useLocation().pathname
    const { id } = useParams()
    
    const handleLogout = async () => {
        try {
            await axios.put(`/api/user/updateStatus/${currentUser.userId}`, { status: 'offline' }, { withCredentials: true });
            dispatch(logout())
            await axios.post('/api/auth/signout', {}, { withCredentials: true })
            socket.emit('userStatusChange');
        } catch (error) {
            console.error(error)
        }
    }
    
  return (
    <aside className="fixed bottom-0 z-50 flex justify-between flex-none w-full h-12 text-lg text-white md:items-center bg-purpleDark md:static md:flex-col md:w-16 md:rounded-l-xl md:py-5 md:h-full md:text-2xl md:bg-purpleFour">
        <div className='relative hidden w-12 h-12 mt-1 rounded-full md:block shrink-0 grow-0'>
            <img src={currentUser.profilePicture || profile} className='absolute object-cover w-full h-full rounded-full'></img>
        </div>
        <div className="w-full mx-10 border-t-2 border-purpleFour md:mx-0 md:border-0">
            <div className="flex justify-between w-full h-full md:justify-center md:flex-col">
                <Link to={'/'} className={`grid w-full hover:bg-[#100023] place-items-center md:aspect-square h-full md:h-fit ${(pathname === '/' || pathname === '/' + id) && 'bg-[#100023] text-purpleFour'}`}>
                    <LuMessageSquare/>
                </Link>
                <Link to={`/profile/${currentUser.userId}`} className={`grid w-full hover:bg-[#100023] place-items-center md:aspect-square h-full md:h-fit ${pathname === `/profile/${currentUser.userId}` && 'bg-[#100023] text-purpleFour'}`}>
                    <LuUser2/>
                </Link>
                <Link to={'/explore'} className={`grid w-full hover:bg-[#100023] place-items-center md:aspect-square h-full md:h-fit ${pathname === '/explore' && 'bg-[#100023] text-purpleFour'}`}>
                    <LuSearch/>
                </Link>
                <button onClick={() => handleLogout()} className="grid w-full md:hidden hover:text-purpleFour hover:bg-[#100023] place-items-center md:aspect-square h-full md:h-fit">
                    <LuLogOut/>
                </button>
            </div>
        </div>
        
        <button onClick={() => handleLogout()} className="w-full hidden md:grid hover:bg-[#100023] place-items-center md:aspect-square">
            <LuLogOut/>
        </button>
    </aside>
  )
}

export default Sidebar