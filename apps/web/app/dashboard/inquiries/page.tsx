import { UnavailablePanel } from "@/components/dashboard/unavailable-panel";

export default function MyInquiriesPage() {
  return <UnavailablePanel title="Your inquiries" description="The API accepts an inquiry and stores it, but it has no endpoint to read inquiries sent or received. Inquiry history and counts are therefore unavailable here."/>;
}
