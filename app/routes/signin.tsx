import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { authenticator } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, { successRedirect: "/shop" });
  return null;
};

export const action = async ({ request }: ActionArgs) => {
  return await authenticator.authenticate("user-pass", request, {
    successRedirect: "/",
  });
};

export default function Signin() {
  return (
    <main className="w-11/12 mx-auto space-y-12">
      <div>
        <div>
          <h1 className="font-bold text-2xl">Sign in to Webly</h1>
          <p>
            or signup{" "}
            <Link to="/signup" className="text-blue-500">
              here
            </Link>
          </p>
        </div>
        <Form className="space-y-4" method="post">
          <input type="text" hidden name="auth-type" defaultValue="signin" />
          <div>
            <label htmlFor="email">Email</label>
            <input type="text" id="email" name="email" />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" />
          </div>
          <button className="w-full bg-black text-white p-2 rounded-md">
            Sign in
          </button>
        </Form>
      </div>
    </main>
  );
}
