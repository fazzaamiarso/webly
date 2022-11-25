import { redirect } from "@remix-run/node";

export const loader = async () => {
  return redirect("/shop");
};

export default function Index() {
  return null;
}
