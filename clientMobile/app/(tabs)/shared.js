import BaseFilePage from "../../components/BaseFilePage";
import { SHARED_API_URL } from "../../consts/Urls";

export default function SharedPage() {
  return <BaseFilePage apiUrl={SHARED_API_URL} title="פריטים ששותפו איתי" />;
}