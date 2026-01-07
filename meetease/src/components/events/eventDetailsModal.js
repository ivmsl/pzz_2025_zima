"use client"
import * as React from "react"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose, 
    DialogTrigger
} from "@/components/ui/dialog"
import {ScrollArea} from "@/components/ui/scrollarea";
import EventCreatorComponent from "@/components/features/event-creator"
import { Button } from "@/components/ui/button"



//event details — przekazywac info o wydarzeniach do modalu 
//wysyła rekwest z pobieraniem nadchodzących wydarzeń 
//lista wszystkich wydarzeń — zwrot 
// detali wydarzenia przekazywane 
// członkowie wydarzenia taze przekazywane
// oraz utworzymy stronę 

const defaultEvent = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Sample Event",
    description: "This is a sample event description.",
    creator_id: "efd34e1a-bfbe-435e-b2be-9718b0736aa2",
    date: "2024-07-01",
    time: "18:00",
    location: "Sample Location",
};

const defaultAttendees = [
    { id: 1, name: "John Doe"},
    { id: 2, name: "Jane Smith"},
    { id: 3, name: "John Doe"},
    { id: 4, name: "Jane Smith"},
    { id: 5, name: "John Doe"},
    { id: 6, name: "Jane Smith"},
];

// export default function EventDetailsModal({user, event = defaultEvent, attendees = defaultAttendees, serverActions}) {

//     const [showEventCreator, setShowEventCreator] = useState(false)
export default function EventDetailsModal({user, event = defaultEvent, attendees = defaultAttendees, serverActions}) {
    const [showEditForm, setShowEditForm] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    
    if (attendees == defaultAttendees) {
        try {
            attendees = event.attendees
            // console.log("Attendees:", attendees)
        } catch (error) {
            // console.error("Error fetching attendees:", error)
            attendees = defaultAttendees
        }
    }


    const isCreator = user?.id === event?.creator_id

    const handleEditClick = () => {
        setIsDialogOpen(false)
        setShowEditForm(true)
    }

    const handleEditSubmit = async (eventData) => {
        if (serverActions.handleUpdateEventServerAction) {
            const { success, error } = await serverActions.handleUpdateEventServerAction(event.id, eventData, user.id)
        }
        setShowEditForm(false)
    }

    const handleDeleteClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setShowDeleteConfirm(true)
    }

    const handleDeleteConfirm = async (e) => {
        e?.preventDefault()
        e?.stopPropagation()
        if (serverActions.handleDeleteEventServerAction) {
            await serverActions.handleDeleteEventServerAction(event.id)
        }
        setShowDeleteConfirm(false)
        setIsDialogOpen(false)
    }

    const handleCancelDelete = (e) => {
        e?.preventDefault()
        e?.stopPropagation()
        setShowDeleteConfirm(false)
    }

    const handleLeaveClick = async () => {
        if (serverActions.handleLeaveEventServerAction) {
            await serverActions.handleLeaveEventServerAction(event.id, user.id)
        }
        setIsDialogOpen(false)
    }

    return (
        <>
{/* <<<<<<< HEAD
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">{event.name}</Button>
            </DialogTrigger>
            <form>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader className={'!border-b-1 border-black pb-4'}>
                        <DialogTitle className={'text-center text-2xl'}>{event.name}</DialogTitle>
                    </DialogHeader>
======= */}
            <Dialog open={isDialogOpen && !showDeleteConfirm} onOpenChange={(open) => {
                if (!showDeleteConfirm) {
                    setIsDialogOpen(open)
                }
            }}>
                <DialogTrigger asChild>
                    <Button variant="outline">{event.name}</Button>
                </DialogTrigger>
                <form>
                    <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader className={'!border-b-1 border-black pb-4'}>
                            <DialogTitle className={'text-center text-2xl'}>{event.name}</DialogTitle>
                        </DialogHeader>

                        <div className={'flex flex-col gap-4'}>
                            <div className="flex flex-col gap-1 text-lg">
                                <div className={'flex gap-2 items-center'}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><path fill="currentColor" d="M5 22q-.825 0-1.412-.587T3 20V6q0-.825.588-1.412T5 4h1V2h2v2h8V2h2v2h1q.825 0 1.413.588T21 6v14q0 .825-.587 1.413T19 22zm0-2h14V10H5zM5 8h14V6H5zm0 0V6z"/></svg>
                                    <span>{event.date}, {event.time}</span>
                                </div>
                                <div className={'flex gap-2 items-center'}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12q.825 0 1.413-.587T14 10t-.587-1.412T12 8t-1.412.588T10 10t.588 1.413T12 12m0 7.35q3.05-2.8 4.525-5.087T18 10.2q0-2.725-1.737-4.462T12 4T7.738 5.738T6 10.2q0 1.775 1.475 4.063T12 19.35M12 22q-4.025-3.425-6.012-6.362T4 10.2q0-3.75 2.413-5.975T12 2t5.588 2.225T20 10.2q0 2.5-1.987 5.438T12 22m0-12"/></svg>
                                    <span>{event.location}</span>
                                </div>
                            </div>

                            <div>
                                <p>{event.description}</p>
                            </div>

                            <div>
                                {event.code && (
                                    <div>
                                        <p>Kod wydarzenia:</p>
                                        <p>{event.code}</p>
                                    </div>
                                )}
                            </div>
                            <h4 className="text-xl font-semi-bold">Uczestnicy:</h4>
                            <ScrollArea className="max-h-64 rounded-md" type="always">
                                <div className="">
                                    {attendees.map((attendee) => (
                                        <React.Fragment key={attendee.id}>
                                            <div className="text-sm">{attendee.username}</div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </ScrollArea>

                        </div>

                    <DialogFooter className={'!border-t-1 border-black pt-4 !justify-between'}>
{/* <<<<<<< HEAD
                {event.creator_id === user.id &&                           
                        

                        <span className={'text-blue-500 cursor-pointer'} >Edytuj wydarzenie</span>        
                    
                }
                <DialogClose asChild> 
                    <Button variant="outline" onClick={() => serverActions.handleLeaveEventServerAction(event.id, user.id)}>
                        <span className={'text-red-500 cursor-pointer'}>Opuść wydarzenie</span>
                    </Button>
                    
                </DialogClose>
                    
======= */}
                        {isCreator && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleEditClick}
                                    className={'text-blue-500 cursor-pointer hover:text-blue-700'}
                                >
                                    Edycja Wydarzenia
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteClick}
                                    className={'text-red-500 cursor-pointer hover:text-red-700'}
                                >
                                    Usuń Wydarzenie
                                </button>
                            </>
                        )}
                        {!isCreator && (
                            <button
                                type="button"
                                onClick={handleLeaveClick}
                                className={'text-red-500 cursor-pointer hover:text-red-700'}
                            >
                                Opuść wydarzenie
                            </button>
                        )}
                    </DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogContent>
            </form>
        </Dialog>

        {showEditForm && (
            <EventCreatorComponent
                user={user}
                event={event}
                isEditing={true}
                onClose={() => setShowEditForm(false)}
                onSubmit={handleEditSubmit}
            />
        )}

        {/* Delete Confirmation Dialog - z-index higher than event modal */}
        {showDeleteConfirm && (
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100]"
                style={{ pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                    // Prevent closing when clicking on backdrop
                    e.stopPropagation()
                }}
                onClick={(e) => {
                    // Close if clicking on backdrop
                    if (e.target === e.currentTarget) {
                        handleCancelDelete(e)
                    }
                }}
            >
                <div 
                    className="bg-white rounded-lg shadow-xl p-6 max-w-md w-[90vw]"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3 className="text-xl font-semibold mb-4">Usuń wydarzenie</h3>
                    <p className="text-gray-600 mb-6">
                        Czy na pewno chcesz usunąć wydarzenie "{event.name}"? Ta operacja jest nieodwracalna.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={handleCancelDelete}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            Anuluj
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={handleDeleteConfirm}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
                        >
                            Usuń
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}
