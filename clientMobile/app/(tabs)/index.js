import BaseFilePage from "../../components/BaseFilePage";
import { RESOURCE_API_URL } from "../../consts/Urls";
import { GENERAL } from "../../consts/General";

export default function MyFilesPage() {
  return <BaseFilePage apiUrl={RESOURCE_API_URL} title={GENERAL.MY_FILES} />;
}