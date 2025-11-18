"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import LoginComponent from "@/components/features/login"
import RegisterComponent from "@/components/features/register"

export default function Home() {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  return (
      <div className="flex min-h-screen flex-row ">

          {/* Left Panel */}
          <div className="w-2/3 h-screen bg-blue-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-0 
                            aspect-square w-full max-w-[450px] justify-center">

              <Image
                src="/imgs/logo.png"
                alt="MeetEase Logo"
                width={300}
                height={300}
                className="object-contain"
              />

              <h1 className="text-center leading-none">
                <span className="text-blue-500 text-8xl font-bold">Meet</span>
                <span className="text-blue-500 text-8xl font-bold">Ease</span>
              </h1>
            </div>
          </div>

        {/* Right Panel */}
        <div className="flex-1 bg-gray-300 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8 flex flex-col justify-center gap-8">

            <div className="space-y-2">
              <h2 className="text-8xl font-bold text-black">Planuj,</h2>
              <h2 className="text-8xl font-bold text-black">Twórz,</h2>
              <h2 className="text-8xl font-bold text-black">Zapraszaj</h2>
            </div>

            <p className="text-xl text-black">Dołącz do świata wydarzeń już dziś</p>

            <div className="space-y-4 pt-4">
              {/* Register button */}
              <Button
                  variant="outline"
                  className="w-full text-black hover:bg-gray-300 text-lg"
                  onClick={() => {
                    setShowRegister(true)
                    setShowLogin(false)
                  }}
              >
                Utwórz konto
              </Button>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-black"></div>
                <span className="px-4 text-black text-m">Lub</span>
                <div className="flex-grow border-t border-black"></div>
              </div>

              {/* Login button */}
              <Button
                  variant="outline"
                  className="w-full text-black hover:bg-gray-300 text-lg"
                  onClick={() => {
                    setShowLogin(true)
                    setShowRegister(false)
                  }}
              >
                Zaloguj się
              </Button>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/">O projekcie</Link>
              <Link href="/">Regulamin</Link>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showLogin && <LoginComponent onClose={() => setShowLogin(false)} />}
        {showRegister && <RegisterComponent onClose={() => setShowRegister(false)} />}
      </div>
  )
}
