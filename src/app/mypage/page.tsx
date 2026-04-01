// マイページは将来の有料アカウント機能として実装予定
// 現在は管理画面（/admin）でアナリティクスを確認できます
import { redirect } from "next/navigation";
export default function MyPage() {
  redirect("/");
}
