import AxiosInstance from '../Axios'
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { setAuth, setUser } from "../redux/userSlice"
import { useState } from "react"
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5"
import LoadingSpinner from "./LoadingSpinner"
import { AxiosError } from 'axios'

const Signin = () => {

    const axios = AxiosInstance()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [error, setError] = useState()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    
    const handleSignin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            setIsLoading(true)
            const form = new FormData(e.currentTarget)
            const username = form.get('username')
            const password = form.get('password')
            const res = await axios.post('/api/auth/signin', { username, password })
            dispatch(setUser(res.data))
            dispatch(setAuth(true))
            navigate('/')
        } catch (error) {
            if (error instanceof AxiosError) setError(error.response?.data)
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }
    
  return (
        <section className="relative flex flex-col items-center justify-center w-full h-full px-6 py-8 _bg-pattern">
          
            <img className="absolute w-40 h-40 -mt-32 -translate-y-full" src="logo.svg" alt="logo"/> 
            
            <div className={`w-full relative rounded-lg shadow-2xl mt-6 md:mt-12 sm:max-w-md bg-transparent _blur border-2 border-purpleFour ${error && 'top-6'}`}>
                    <form className="p-6 space-y-4 text-white md:space-y-6 sm:p-8" onSubmit={handleSignin}>
                        {error && <p className="text-lg font-bold text-red-500">{error}</p>}
                        <div>
                            <label htmlFor="username" className="block mb-2 text-sm font-medium">Username</label>
                            <input type="text" name="username" id="username" className="bg-slate-600 outline-none text-white sm:text-sm rounded-lg border-2 border-transparent focus:border-white focus:bg-transparent block w-full p-2.5" placeholder="John Smith" required/>
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-medium dark:text-white">Password</label>
                            <div className="flex items-center justify-between bg-slate-600 outline-none border-2 border-transparent sm:text-sm rounded-lg focus-within:bg-transparent focus-within:border-white w-full p-2.5" tabIndex={0}>
                                <input type={showPassword ? 'text' : 'password'} name="password" id="password" placeholder="••••••••" className="w-full bg-transparent outline-none" required/>
                                <button className="px-2 outline-none" onClick={() => setShowPassword(prev => !prev)} type="button">{showPassword ? <IoEyeOutline/> : <IoEyeOffOutline/>}</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <button type="submit" className="w-full text-white bg-purpleFour hover:bg-purpleHover focus:ring-2 focus:outline-none focus:ring-purpleThree font-medium rounded-lg text-sm px-5 py-2.5 grid place-items-center">{!isLoading ? 'Login' : <LoadingSpinner/>}</button>
                            <div className='relative flex justify-center w-full py-1'>
                                <p className="absolute w-full h-0.5 bg-slate-600 top-1/2 -transalte-y-1/2"></p>
                                <p className='z-10 px-2 bg-purpleDark'>Or</p>
                            </div>
                            <button type="button" onClick={() => navigate('/signup')} className="w-full text-purpleFour bg-slate-100 hover:bg-slate-300 font-medium focus:ring-2 focus:outline-none focus:ring-purpleThree rounded-lg text-sm px-5 py-2.5 text-center">Create an account</button>
                        </div> 
                    </form>
            </div>
            
        </section>
  )
}

export default Signin