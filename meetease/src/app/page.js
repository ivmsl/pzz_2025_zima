import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-row ">
      {/* Left Panel - Blue Background */}
      <div className="flex-1/3 bg-sky-800 flex items-center justify-center p-4">
        <div className=" rounded-2xl p-12 flex flex-col items-center gap-6 max-w">
          <Image src="/imgs/logo.png" alt="MeetEase Logo" width={600} height={600} />
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold">
              <span className="text-black text-8xl">Meet</span>
              <span className="text-gray-200 text-8xl">Ease</span>
            </h1>
            
          </div>
        </div>
      </div>

      {/* Right Panel - Light Gray Background */}
      <div className="flex-1 bg-gray-200 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 flex flex-col justify-center gap-8">
          {/* Tagline */}
          <div className="space-y-2">
            <h2 className="text-8xl font-bold text-black">Planuj,</h2>
            <h2 className="text-8xl font-bold text-black">Twórz,</h2>
            <h2 className="text-8xl font-bold text-black">Zapraszaj</h2>
          </div>

          {/* Join Today Text */}
          <p className="text-xl text-black">Dołącz do świata wydarzeń już dziś</p>

          {/* Buttons */}
          <div className="space-y-4 pt-4">
            
            <Button 
              variant="outline" 
              className="w-full  text-black hover:bg-gray-300 text-lg"
            >
              Utwórz konto
            </Button>

            {/* Divider */}
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-black"></div>
              <span className="px-4 text-black text-m">Lub</span>
              <div className="flex-grow border-t border-black"></div>
            </div>

            <Button 
              variant="outline" 
              className="w-full text-black hover:bg-gray-300 text-lg"
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
    </div>
  )
}
