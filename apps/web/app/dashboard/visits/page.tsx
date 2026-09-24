import { UnavailablePanel } from "@/components/dashboard/unavailable-panel";

export default function MyVisitsPage() {
  return <UnavailablePanel title="Your visit requests" description="The API accepts visit requests but does not expose a read or status update endpoint. Request history and status changes are unavailable here."/>;
}
