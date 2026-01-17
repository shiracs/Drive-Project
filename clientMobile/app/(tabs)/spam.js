import BaseFilePage from "../../components/BaseFilePage";
import { SPAM_API_URL } from "../../consts/Urls";

export default function SpamPage() {
  return <BaseFilePage apiUrl={SPAM_API_URL} title="ספאם" />;
}