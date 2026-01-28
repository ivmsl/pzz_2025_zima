import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export default function GeneralOptionField( { opt, idx, setOptions, delDisabled = true, disabled = false } ) {
    return (
        <div key={idx} className="flex items-center gap-4 py-2">
            <input
                type="text"
                value={opt}
                disabled={disabled}
                onChange={(e) => { 
                    const value = e.target.value
                    setOptions((prev) => prev.map((p, i) => (i === idx ? value : p)))
                }}
                placeholder={`Opcja ${idx + 1}`}
                className="flex-1 border border-gray-300 rounded-lg px-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <Button
                type="button"
                variant="ghost"
                onClick={() => {
                    setOptions((prev) => {
                        if (prev.length <= 2) return prev
                        return prev.filter((_, i) => i !== idx)
                        })
                }}
                    disabled={delDisabled}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                <Trash2 className="w-4 h-4" />
                </Button>
            </div>
    )
}