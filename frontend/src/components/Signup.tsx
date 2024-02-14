import AxiosInstance from '../Axios'
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux";
import { changeUsername, changePassword, setStatus, setUser, clearAllInput, setAuth } from "../redux/userSlice";
import { RootState } from "../redux/store";
import { ZodError, z } from "zod";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import LoadingSpinner from "./LoadingSpinner";

const Signup = () => {

    const usernameType = z
    .string({ invalid_type_error: 'Please enter a valid username.' })
    .min(4, { message: 'Too short.' })
    .max(15, { message: 'Too long.' })
    .refine(username => !username.includes(' ') , { message: 'Username must not contain spaces.' })
    .refine(username => isNaN(parseInt(username[0])), { message: 'Username must not start with a number.' })

    const passwordType = z.string().min(4).max(20)
    
    const axios = AxiosInstance()
    const [searchParams, setSearchParams] = useSearchParams()
    const step = searchParams.get('step') as '1' | '2' | '3' || '1'
    const dispatch = useDispatch()
    const usernameStatus = useSelector((state: RootState) => state.user.usernameStatus)
    const currentUsername = useSelector((state: RootState) => state.user.currentUsername)
    const currentPassword = useSelector((state: RootState) => state.user.currentPassword)
    const [passwordConfirm, setPasswordConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    
    const checkUsernameAvailability = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const username = e.target.value
            usernameType.parse(username)
            dispatch(changeUsername(username))
            const res = await axios.get(`/api/auth/username/${username}`)
            dispatch(setStatus(res.data))
        } catch (error) {
            if (error instanceof ZodError) {
                dispatch(setStatus({
                    status: 'unavailable',
                    message: error.issues[0].message
                }))
            }
        }
    }

    const handleStepOneSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (usernameStatus.status === 'available') setSearchParams('?step=2')
    }

    const handleStepTwoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            passwordType.parse(currentPassword)
            if (usernameStatus.status === 'available' && currentUsername.length > 0) setSearchParams('?step=3')
        } catch (error) {
            console.error(error)
        }
    }
    
    const handleStepThreeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (currentPassword === passwordConfirm && usernameStatus.status === 'available' && currentUsername.length > 0) {
            handleSignup()
        }
    }

    const handleSignup = async () => {
        try {
            setIsLoading(true)
            const res = await axios.post('/api/auth/signup', { username: currentUsername, password: currentPassword })
            dispatch(setUser(res.data))
            dispatch(clearAllInput())
            dispatch(setAuth(true))
            navigate('/')
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }
    
  return (
    <section className="flex flex-col items-center w-full h-full gap-3 _bg-pattern">

        <img className="translate-y-1/4 w-52 h-52" src="logo.svg" alt="logo"/> 

        <ol className="flex items-center justify-center space-x-2 font-medium text-center text-white rounded-lg shadow-sm md:text-2xl w-fit sm:text-base sm:space-x-4 rtl:space-x-reverse">
            <li className={`flex items-center ${step === '1' && 'text-purpleThree'}`}>
                <span className={`flex items-center justify-center h-7 w-7 md:h-10 md:w-10 rounded-full me-2 shrink-0 ${step === '1' && 'border border-purpleFour'}`}>
                    1
                </span>
                <svg className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m7 9 4-4-4-4M1 9l4-4-4-4"/>
                </svg>
            </li>
            <li className={`flex items-center ${step === '2' && 'text-purpleThree'}`}>
                <span className={`flex items-center justify-center h-7 w-7 md:h-10 md:w-10 rounded-full me-2 shrink-0 ${step === '2' && 'border border-purpleFour'}`}>
                    2
                </span>
                <svg className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m7 9 4-4-4-4M1 9l4-4-4-4"/>
                </svg>
            </li>
            <li className={`flex items-center ${step === '3' && 'text-purpleThree'}`}>
                <span className={`flex items-center justify-center h-7 w-7 md:h-10 md:w-10 rounded-full me-2 shrink-0 ${step === '3' && 'border border-purpleFour'}`}>
                    3
                </span>
            </li>
        </ol>

        <div className="flex items-center w-3/4 overflow-hidden lg:w-1/3">
            {/* STEP 1 */}
            <form className={`w-full space-y-3 overflow-hidden text-white transition-all duration-300 ease-in-out delay-100 grow-0 shrink-0 ${step === '1' ? 'opacity-100' : 'opacity-0'}`} style={{ transform: `translateX(${-100 * (Number(step) - 1)}%)` }} onSubmit={handleStepOneSubmit}>
                    <div>
                        <p className="text-2xl">Pick a username</p>
                        <p className="text-purpleThree">&#x1F6C8; <span className="text-xs">Dont worry, you can always change it later</span></p>
                    </div>
                    <p className={`font-bold ${usernameStatus.status === 'available' ? 'text-green-500' : 'text-red-600'}`}>{usernameStatus.message}</p>
                    <input defaultValue={currentUsername} type="text" name="username" onChange={checkUsernameAvailability} className="bg-transparent _blur outline-none text-white sm:text-sm rounded-lg border-2 border-purpleFour block w-full p-2.5" placeholder="Chris" minLength={4} maxLength={15} required/>
                    <button type="submit" className="px-10 py-2 text-sm font-medium text-white border-2 border-transparent rounded-lg w-fit bg-purpleFour hover:bg-transparent hover:border-purpleFour disabled:opacity-50 disabled:hover:bg-purpleFour disabled:cursor-not-allowed" disabled={usernameStatus.status === 'available' ? false : true}>Next</button>
            </form>
            
            {/* STEP 2 */}
            <form className={`w-full space-y-3 overflow-hidden text-white transition-all duration-300 ease-in-out delay-100 grow-0 shrink-0 ${step === '2' ? 'opacity-100' : 'opacity-0'}`} style={{ transform: `translateX(${-100 * (Number(step) - 1)}%)` }} onSubmit={handleStepTwoSubmit}>
                    <div>
                        <p className="text-2xl">Now choose a password</p>
                        <p className="text-purpleThree">&#x1F6C8; <span className="text-xs">4-20 Characters</span></p>
                    </div>
                    <div className="flex items-center justify-between border-2 rounded-lg _blur border-purpleFour">
                        <input type={showPassword ? 'text' : 'password'} name="password" defaultValue={currentPassword} className="bg-transparent rounded-lg outline-none text-white sm:text-sm w-full p-2.5" placeholder="••••••••" minLength={4} maxLength={20} onChange={(e) => dispatch(changePassword(e.target.value))} required/>
                        <button type="button" className="px-4 outline-none" onClick={() => setShowPassword(prev => !prev)}>{showPassword ? <IoEyeOutline/> : <IoEyeOffOutline/>}</button>
                    </div>
                    <button type="submit" className="px-10 py-2 text-sm font-medium text-white border-2 border-transparent rounded-lg w-fit bg-purpleFour hover:bg-transparent hover:border-purpleFour disabled:opacity-50 disabled:hover:bg-purpleFour disabled:cursor-not-allowed" disabled={usernameStatus.status !== 'available' || currentPassword.length < 4 ? true : false}>Next</button>
            </form>
            
            {/* STEP 3*/}
            <form className={`w-full space-y-3 overflow-hidden text-white transition-all duration-300 ease-in-out delay-100 grow-0 shrink-0 ${step === '3' ? 'opacity-100' : 'opacity-0'}`} style={{ transform: `translateX(${-100 * (Number(step) - 1)}%)` }} onSubmit={handleStepThreeSubmit}>
                    <p className="text-2xl">One more time...</p>
                    <div className="flex items-center justify-between border-2 rounded-lg _blur border-purpleFour">
                        <input type={showPassword ? 'text' : 'password'} id="password-confirmation" defaultValue={passwordConfirm} name="password-confirmation" className="bg-transparent rounded-lg outline-none text-white sm:text-sm w-full p-2.5" onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="••••••••" required/>
                        <button type="button" className="px-4 outline-none" onClick={() => setShowPassword(prev => !prev)}>{showPassword ? <IoEyeOutline/> : <IoEyeOffOutline/>}</button>
                    </div>
                    <button type="submit" className="grid px-10 py-2 text-sm font-medium text-white border-2 border-transparent rounded-lg w-fit bg-purpleFour hover:bg-transparent hover:border-purpleFour disabled:opacity-50 disabled:hover:bg-purpleFour disabled:cursor-not-allowed place-items-center" disabled={passwordConfirm === currentPassword && usernameStatus.status === 'available' ? false : true}>{!isLoading ? 'Confirm password' : <LoadingSpinner/>}</button>
            </form>
        </div>
        
    </section>
  )
}

export default Signup