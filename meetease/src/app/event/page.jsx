import EventCreator from "../../components/features/event-creator";
import { createEvent } from "@/lib/eventService";
import { getAuthenticatedUser } from "@/utils/auth";
import { redirect } from "next/navigation";

export async function handleEventSubmit(eventData) {
  "use server"
  const event = await createEvent(eventData)
  console.log("Event created:", event)
  redirect(`/event/${event.id}`)
}

export default async function TestPage() {
  const { user } = await getAuthenticatedUser()
  
  return (
    <div>
      
      <EventCreator user={user} onSubmit={handleEventSubmit} />
    </div>
  );
}
