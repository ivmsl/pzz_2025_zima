import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import GeneralOptionField from "@/components/votes/generalOptionField"
import DateTimeOptionField from "@/components/votes/dateTimeOptionField"
import { useImperativeHandle } from "react"
import { useEffect } from "react"

// enum VoteType = "general" | "location" | "time"

export default function GeneralVote({ eventId, voteObj, type, ref, disabled = false }) {

    const [voteDescriptor, setVoteDescriptor] = useState({
        id: voteObj?.voteDescriptor?.id || "",
        event_id: eventId || voteObj?.voteDescriptor?.event_id || "",
        type: voteObj?.voteDescriptor?.type || type || "general", 
        question: voteObj?.voteDescriptor?.question || "",
        deadline: voteObj?.voteDescriptor?.deadline || "",
        deadlineTime: voteObj?.voteDescriptor?.deadlineTime || ""
    })
    const [options, setOptions] = useState(voteObj?.options || ["", ""]) //options OF TYPE { id, vote_id, option_text } ]
    const [timedOption, setTimedOption] = useState(voteObj?.timedOptions || [{ date: "", start: "", end: "" }, { date: "", start: "", end: "" }])
    
    useEffect(() => {
        if (voteObj) {
            console.log("voteObj is : ", voteObj)
        }
    }, [voteObj])

    useImperativeHandle(ref, () => ({
        returnVoteDescriptor: () => {
            return {
                voteDescriptor,
                options,
                timedOption
            }
        },
        checkValidity: () => {
            if (type === "general" || type === "location") {
                let isValid = voteDescriptor.question.trim() && options.length >= 2 && voteDescriptor.deadline && voteDescriptor.deadlineTime && options.reduce((acc, curr) => acc && curr.trim(), true)
                return isValid && true;                
            } else if (type === "time") {
                let isValid = voteDescriptor.question.trim() && timedOption.length >= 2 && timedOption.reduce((acc, curr) => acc && curr.date.trim() && curr.start.trim() && curr.end.trim(), true)
                return isValid && true;
            }
            else return false;
        }
    }))

    const handleChange = (field, value) => {
        setVoteDescriptor(prev => ({
        ...prev,
        [field]: value
        }))
    }

    const addOptions = () => {
        if (type === "time") {
            setTimedOption([...timedOption, { date: "", start: "", end: "" }])
        } else {
            setOptions([...options, "Nowa opcja"])
        }
    }

    return (
        <div>
            <div className="mt-8 border border-gray-200 rounded-2xl p-6 bg-gray-50">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Utwórz głosowanie {type === "location" ? "nad miejscem" : type === "time" ? "nad czasem" : "ogólne"}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOptions}
                    disabled={disabled}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Dodaj opcję
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nazwa głosowania
                    </label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={voteDescriptor.question}
                      onChange={(e) => handleChange("question", e.target.value)}
                      placeholder="Np. Gdzie idziemy na kolację?"
                      className="w-full border border-gray-300 rounded-lg px-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Termin zakończenia głosowania (opcjonalnie)
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="date"
                        disabled={disabled}
                        value={voteDescriptor.deadline}
                        onChange={(e) => handleChange("deadline", e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <input
                        type="time"
                        disabled={disabled}
                        value={voteDescriptor.deadlineTime}
                        onChange={(e) => handleChange("deadlineTime", e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Po upływie terminu głosowanie będzie zamknięte i nie będzie możliwe oddanie lub zmiana głosu.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opcje (min. 2)
                    </label>
                    <div className="space-y-3">
                    {(type === "general" || type === "location") && (
                        <>
                            {options.map((opt, idx) => (
                                <GeneralOptionField key={idx} opt={opt} idx={idx} setOptions={setOptions} delDisabled={options.length <= 2} disabled={disabled} />
                            ))}
                        </>
                    )}
                    {type === "time" && (
                        <>
                            {timedOption.map((opt, idx) => (
                                <DateTimeOptionField key={idx} opt={opt} idx={idx} setOptions={setTimedOption} delDisabled={timedOption.length <= 2} disabled={disabled} />
                            ))}
                        </>
                    )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Głosowanie jest anonimowe — widoczne będą tylko wyniki w procentach.
                    </p>
                  </div>
                </div>
              </div>
        </div>
    )
}