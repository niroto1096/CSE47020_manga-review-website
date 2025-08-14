import React, { useState } from "react"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Button } from "@/components/ui/button"
import { verifyOTP } from "@/Api/authApi"
import { useNavigate } from "react-router-dom"

const Otp = () => {
  const [otp, setOtp] = useState("")
  const email = localStorage.getItem('email');
  const navigate = useNavigate()
  const handleSubmit = async() => {
    console.log("Entered OTP:", otp)
    try{
      const response = await verifyOTP(email,otp)
      console.log(response)
      localStorage.removeItem('email')
      navigate('/login')
    }catch(error){
      console.log(error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-semibold">Enter the OTP</h2>
        <InputOTP
          maxLength={4}
          value={otp}
          onChange={(value) => setOtp(value)}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>

        <Button
          onClick={handleSubmit}
          className="w-full max-w-sm"
          disabled={otp.length < 4}
        >
          Verify
        </Button>
      </div>
    </div>
  )
}

export default Otp

