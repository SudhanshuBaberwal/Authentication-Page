import React from 'react'
import { Routes , Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import EmaillVerify from './pages/EmaillVerify'
import ResetPassword from './pages/ResetPassword'
import { ToastContainer, toast } from 'react-toastify';

const App = () => {
  return (
    <div>
      <ToastContainer/>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/email-verify' element={<EmaillVerify/>} />
        <Route path='/reset-password' element={<ResetPassword/>} />
      </Routes>
    </div>
  )
}

export default App
