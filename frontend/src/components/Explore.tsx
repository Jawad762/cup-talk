import { useQuery } from "@tanstack/react-query";
import AxiosInstance from '../Axios'
import { LuSearch } from "react-icons/lu";
import { User } from "../types";
import profile from '../../public/pfp-default.jpg'
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const Explore = () => {
  
  const axios = AxiosInstance()
  const currentUser: User = useSelector((state: RootState) => state.user.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const searchInput = searchParams.get('search')

  const performSearch = async () => {
    const res = await axios.get(`/api/user/search/${currentUser.userId}/${searchInput}`)
    return res.data
  }

  const { data: users, refetch } = useQuery({ queryKey: ['search', searchInput], queryFn: performSearch, enabled: false })

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    refetch()
  }
  
  return (
    <section className="flex flex-col w-full h-full px-10 sm:px-14 _bg-pattern-2 md:max-w-[70%] lg:max-w-[50%] md:rounded-r-xl text-white">
      
      <form onSubmit={handleSearch} className="relative px-3 py-2 my-6 bg-transparent border-2 border-white rounded-full">
        <input placeholder="Search for users..." className="w-full pr-3 bg-transparent outline-none " onChange={(e) => setSearchParams(`?search=${e.target.value}`)}></input>
        <button type="submit" className="absolute top-0 right-0 grid w-10 h-10 text-lg translate-x-1/2 rounded-full bg-purpleDark place-items-center"><LuSearch/></button>
      </form>
      
      <div className="flex-grow pb-12 space-y-1 overflow-y-auto md:pb-0">
      {users && users.map((user: User) => (
          <Link to={`/profile/${user.userId}`} key={user.userId} className="flex items-center gap-4 p-3 mb-2 rounded-full hover:bg-purpleFour">
            <div className='relative w-12 h-12 rounded-full shrink-0 grow-0'>
                <img src={user.profilePicture || profile} className='absolute object-cover w-full h-full rounded-full'></img>
            </div>
            <p>{user.username}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default Explore