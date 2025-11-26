"use client"
import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {ScrollArea} from "@/components/ui/scrollarea";

export default function EventDetailsModal({user}) {

    const event = {
        id: 1,
        name: "Sample Event",
        description: "This is a sample event description.",
        creator_id: "efd34e1a-bfbe-435e-b2be-9718b0736aa2",
        date: "2024-07-01",
        time: "18:00",
        location: "Sample Location",
    };

    const attendees = [
        { id: 1, name: "John Doe"},
        { id: 2, name: "Jane Smith"},
        { id: 3, name: "John Doe"},
        { id: 4, name: "Jane Smith"},
        { id: 5, name: "John Doe"},
        { id: 6, name: "Jane Smith"},
        { id: 7, name: "John Doe"},
        { id: 8, name: "Jane Smith"},
        { id: 9, name: "John Doe"},
        { id: 10, name: "Jane Smith"},
        { id: 11, name: "Jane Smith"},
        { id: 12, name: "John Doe"},
        { id: 13, name: "Jane Smith"},
        { id: 14, name: "Jane Smith"},
        { id: 15, name: "Jane Smith"},
        { id: 16, name: "Jane Smith"}
    ];

    return (
        <Dialog open={true}>
            <form>
                <DialogContent className="sm:max-w-[425px]">
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

                            <h4 className="text-xl font-semi-bold">Uczestnicy:</h4>
                            <ScrollArea className="max-h-64 rounded-md" type="always">
                                <div className="">
                                    {attendees.map((attendee) => (
                                        <React.Fragment key={attendee.id}>
                                            <div className="text-sm">{attendee.name}</div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </ScrollArea>

                        </div>

                    <DialogFooter className={'!border-t-1 border-black pt-4 !justify-between'}>
                        {event.creator_id === user.id && <span className={'text-blue-500 cursor-pointer'}>Edytuj wydarzenie</span>}
                        <span className={'text-red-500 cursor-pointer'}>Opuść wydarzenie</span>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    )
}
