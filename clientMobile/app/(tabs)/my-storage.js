import BaseFilePage from "../../components/BaseFilePage";
import { OWNED_API_URL } from "../../consts/Urls";

export default function MyStoragePage() {
  return <BaseFilePage apiUrl={OWNED_API_URL} title="האחסון שלי" />;
}