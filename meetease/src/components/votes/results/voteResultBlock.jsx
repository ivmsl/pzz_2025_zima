import { Button } from "@/components/ui/button"

export default function VoteResultBlock({ voteDescriptor, results, userVote, onCastVote }) {


    const calculatePercentage = (optionId) => {
        const totalVotes = results.reduce((acc, opt) => acc + opt.total_votes, 0)
        const optionVotes = results.find(opt => opt.option_id === optionId)?.total_votes || 0
        return (optionVotes / totalVotes) * 100
    }

    const handleCastVote = async (optionId) => {
        // console.log("optionId: ", optionId, "userId: ", userId)
        await onCastVote(voteDescriptor.id, optionId)
        
    }

    const checkDeadline = () => {
        if (voteDescriptor.deadline) {
            return new Date(voteDescriptor.deadline) < new Date()
        }
        return false
    }

    return (
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{voteDescriptor.question}</h3>
                
                <p className="text-sm text-gray-500">{
                    (voteDescriptor.type === "time") ? "Wybieramy czas" : voteDescriptor.type === "location" ? "Wybieramy lokalizację" : "Anonimowe — widoczne są tylko wyniki."} </p>
                {voteDescriptor.deadline && (
                  <p className="text-xs text-gray-400 mt-1">
                    Koniec: {voteDescriptor.deadline ? new Date(voteDescriptor.deadline).toLocaleString("pl-PL") : "Nie określono"}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              {/* <div className="text-sm text-gray-500 mt-1">
                Status: <b>{voteDescriptor.deadline ? "Zamknięte" : "Otwarte"}</b> • Oddane głosy: <b>{results.length}</b>
              </div> */}

                <div className="mt-4 space-y-3">
                  <div className="flex flex-col gap-2">
                    {results.map((opt) => (
                        
                        <Button 
                            key={"button" + opt.option_id} 
                            disabled={!!userVote}
                            onClick={(e) => {
                                handleCastVote(opt.option_id)
                            }}
                            variant="outline"
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer relative flex-row justify-between"
                            style={
                                (!!userVote || checkDeadline())  ? {
                                    background: `linear-gradient(90deg, #dbeafe ${calculatePercentage(opt.option_id)}%, transparent ${calculatePercentage(opt.option_id)}%)`
                                } : undefined
                            }
                            >
                                {opt.option_text}
                                {userVote == opt.option_id && (
                                    <span key={"your-vote" + opt.option_id} className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full">
                                        <svg className="w-3 h-3 text-blue-600 mr-1" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M12.03 4.97a.75.75 0 10-1.06-1.06L7 7.94 5.03 5.97A.75.75 0 003.97 7.03l2.5 2.5a.75.75 0 001.06 0l4.5-4.5z"/>
                                        </svg>
                                    </span>
                                )}
                                {!!userVote && !checkDeadline() && (
                                    <span key={"percentage" + opt.option_id} className={`text-xs text-gray-500`}>{calculatePercentage(opt.option_id)}%</span>
                                )}                                
                                
                        </Button>
                        
                       
                    ))}
                  </div>
                </div>  
                    
                    {/* // <label key={opt.id} className="flex items-center gap-3 border rounded-lg p-3 bg-gray-50 cursor-pointer">
                    //   <input
                    //     type="radio"
                    //     name={`vote-${voteDescriptor.id}`}
                    //     value={opt.id}
                    //     checked={userVote?.id === opt.id}
                    //     onChange={() => setSelectedByVoteId((prev) => ({ ...prev, [v.id]: opt.id }))}
                    //     className="w-4 h-4"
                    //   />
                    //   <span className="text-gray-900">{opt.option_text}</span>
                    //   {userVote?.id === opt.id && (
                    //     <span className="text-xs ml-auto px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Twój wybór</span>
                    //   )}
                    // </label>
                  )}
                  {/* <Button type="button" onClick={() => handleCast(v.id)} disabled={!selectedByVoteId[v.id] || actionLoadingId === v.id}>
                    {actionLoadingId === v.id ? "Głosowanie..." : alreadyVoted ? "Zmień głos" : "Oddaj głos"}
                  </Button> */}
                


              {/* <div className="mt-6 space-y-3">
                {options.map((opt) => (
                  <div key={opt.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{opt.option_text}</span>
                        {v.userVoteOptionId === opt.id && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Twój wybór</span>
                        )}
                      </div>
                      <span className="text-gray-700">
                        {opt.percent}% ({opt.votes})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${opt.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div> */}
            </div>
          </div>
    )
}