import BaseFilePage from "../../components/BaseFilePage";
import { TRASH_API_URL } from "../../consts/Urls";

export default function MyFilesPage() {
  return <BaseFilePage apiUrl={TRASH_API_URL} title="אשפה" />;
}