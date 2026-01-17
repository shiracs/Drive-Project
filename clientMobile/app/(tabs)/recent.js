import BaseFilePage from "../../components/BaseFilePage";
import { RECENT_API_URL } from "../../consts/Urls";

export default function RecentPage() {
  return <BaseFilePage apiUrl={RECENT_API_URL} title="עדכן לאחרונה" />;
}