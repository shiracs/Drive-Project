import BaseFilePage from "../../components/BaseFilePage";
import { STARRED_API_URL } from "../../consts/Urls";

export default function MyFilesPage() {
  return <BaseFilePage apiUrl={STARRED_API_URL} title="מסומן בכוכב" />;
}