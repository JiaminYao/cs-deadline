import { loadConferences } from "@/lib/conferences";
import { ConferenceList } from "@/components/conference/ConferenceList";

export default function Home() {
  const conferences = loadConferences();

  return (
    <div className="space-y-6">
      <ConferenceList conferences={conferences} />
    </div>
  );
}
